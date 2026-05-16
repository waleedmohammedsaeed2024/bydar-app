import { supabase } from '@/lib/supabase';
import type { PurchaseInvoice } from '@/lib/database.types';

const PI_LIST_SELECT = `
  id, invoice_no, invoice_date, supplier_id, supplier_inv_no, created_at, updated_at,
  supplier:partner!purchase_invoice_supplier_id_fkey(id, partner_name, phone_no),
  purchase_invoice_item(quantity, item_cost, deleted_at)
`;

const PI_DETAIL_SELECT = `
  id, invoice_no, invoice_date, supplier_id, supplier_inv_no, created_at, updated_at,
  supplier:partner!purchase_invoice_supplier_id_fkey(id, partner_name, partner_type, parent_client_id, phone_no, balance),
  purchase_invoice_item(
    id, purchase_invoice_id, item_id, packaging_id, quantity, item_cost, repack_factor, description, deleted_at,
    item:inventory_item(id, item_name, item_english_name, item_image, avg_cost, quantity, orderpoint),
    packaging:packaging(id, pack_arab, pack_eng)
  )
`;

export type PIFilters = {
  search?: string;
  /** YYYY-MM-DD — limits to this day. */
  date?: string;
  limit?: number;
};

export async function fetchPurchaseInvoices(filters: PIFilters = {}): Promise<PurchaseInvoice[]> {
  let q = supabase
    .from('purchase_invoice')
    .select(PI_LIST_SELECT)
    .is('deleted_at', null)
    .order('invoice_date', { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.date) {
    q = q.gte('invoice_date', `${filters.date}T00:00:00`)
         .lt('invoice_date', `${filters.date}T23:59:59.999`);
  }

  const { data, error } = await q;
  if (error) throw new Error(`fetchPurchaseInvoices: ${error.message}`);
  let rows = (data ?? []) as unknown as PurchaseInvoice[];

  if (filters.search && filters.search.trim()) {
    const t = filters.search.trim();
    rows = rows.filter(
      (r) =>
        r.invoice_no?.includes(t) ||
        r.supplier_inv_no?.includes(t) ||
        r.supplier?.partner_name?.includes(t),
    );
  }
  return rows;
}

export async function fetchPurchaseInvoiceById(id: string): Promise<PurchaseInvoice> {
  const { data, error } = await supabase
    .from('purchase_invoice')
    .select(PI_DETAIL_SELECT)
    .eq('id', id)
    .single();
  if (error) throw new Error(`fetchPurchaseInvoiceById: ${error.message}`);
  return data as unknown as PurchaseInvoice;
}

export type NewPurchaseInput = {
  supplier_id: string;
  supplier_inv_no: string | null;
  invoice_date: string; // ISO
  lines: Array<{
    item_id: string;
    packaging_id: string | null;
    quantity: number;
    item_cost: number;
  }>;
};

function generateInvoiceNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PI-${y}${m}${day}-${rand}`;
}

// Weighted Average Cost. Result rounds to 4 decimals to keep numeric columns
// from drifting on repeated updates.
function weightedAverage(
  oldQty: number, oldCost: number, addQty: number, addCost: number,
): number {
  const total = oldQty + addQty;
  if (total <= 0) return addCost;
  const w = (oldQty * oldCost + addQty * addCost) / total;
  return Math.round(w * 10_000) / 10_000;
}

// Bump item_stock for one purchase line. If a row exists for the same
// item_id + packaging_id, update qty and recompute avg_cost via WAC.
// Otherwise insert a new row. NOTE: this is not transactional with the
// invoice insert — a server-side trigger / RPC would be safer for concurrency.
async function applyStockForLine(line: {
  item_id: string;
  packaging_id: string | null;
  quantity: number;
  item_cost: number;
}): Promise<void> {
  let q = supabase
    .from('item_stock')
    .select('id, quantity, avg_cost')
    .eq('item_id', line.item_id);
  q = line.packaging_id === null
    ? q.is('packaging_id', null)
    : q.eq('packaging_id', line.packaging_id);

  const { data: existing, error: readErr } = await q.maybeSingle();
  if (readErr) throw new Error(`applyStockForLine read: ${readErr.message}`);

  if (existing) {
    const newQty = Number(existing.quantity) + line.quantity;
    const newAvg = weightedAverage(
      Number(existing.quantity),
      Number(existing.avg_cost),
      line.quantity,
      line.item_cost,
    );
    const { error: upErr } = await supabase
      .from('item_stock')
      .update({ quantity: newQty, avg_cost: newAvg })
      .eq('id', existing.id);
    if (upErr) throw new Error(`applyStockForLine update: ${upErr.message}`);
  } else {
    const { error: insErr } = await supabase
      .from('item_stock')
      .insert({
        item_id: line.item_id,
        packaging_id: line.packaging_id,
        quantity: line.quantity,
        avg_cost: line.item_cost,
      });
    if (insErr) throw new Error(`applyStockForLine insert: ${insErr.message}`);
  }
}

export async function createPurchaseInvoice(input: NewPurchaseInput): Promise<{ id: string }> {
  if (input.lines.length === 0) {
    throw new Error('createPurchaseInvoice: must have at least one line');
  }

  const { data: inv, error: invErr } = await supabase
    .from('purchase_invoice')
    .insert({
      invoice_no: generateInvoiceNo(),
      invoice_date: input.invoice_date,
      supplier_id: input.supplier_id,
      supplier_inv_no: input.supplier_inv_no,
    })
    .select('id')
    .single();
  if (invErr) throw new Error(`createPurchaseInvoice: ${invErr.message}`);

  const linesToInsert = input.lines.map((l) => ({
    purchase_invoice_id: inv.id,
    item_id: l.item_id,
    packaging_id: l.packaging_id,
    quantity: l.quantity,
    item_cost: l.item_cost,
    repack_factor: 1,
  }));

  const { error: lineErr } = await supabase
    .from('purchase_invoice_item')
    .insert(linesToInsert);
  if (lineErr) {
    await supabase.from('purchase_invoice').delete().eq('id', inv.id);
    throw new Error(`createPurchaseInvoice lines: ${lineErr.message}`);
  }

  // Update stock + WAC for each line. Sequential so concurrent lines on the
  // same (item, packaging) compose correctly within this submission.
  for (const l of input.lines) {
    await applyStockForLine(l);
  }

  return { id: inv.id };
}
