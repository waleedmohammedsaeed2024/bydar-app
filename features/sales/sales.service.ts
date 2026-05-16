// TODO: align column names with web `src/features/sales/sales.service.ts`.
// Shapes here match the plan §4. Inserts assume DB triggers compute totals;
// if the web service computes them client-side, replicate that here.

import { supabase } from '@/lib/supabase';
import type { OrderStatus, SalesOrder, SalesOrderLine } from '@/lib/database.types';
import { CLIENT_ID } from '@/lib/tenant';
import { calcItemPrice } from '@/lib/utils';

const ORDER_DETAIL_SELECT = `
  id, order_date, client_id, customer_id, site, status, description, created_at, updated_at, deleted_at,
  client:partner!sales_order_client_id_fkey(id, partner_name, partner_type, parent_client_id, phone_no, balance),
  customer:partner!sales_order_customer_id_fkey(id, partner_name, partner_type, parent_client_id, phone_no, balance),
  sales_order_item(
    id, sales_order_id, item_id, packaging_id, quantity, item_price, item_cost, deleted_at,
    item:inventory_item(id, item_name, item_english_name, item_image, avg_cost, quantity, orderpoint),
    packaging:packaging(id, pack_arab, pack_eng)
  )
`;

const ORDER_LIST_SELECT = `
  id, order_date, client_id, customer_id, site, status, created_at, updated_at,
  client:partner!sales_order_client_id_fkey(id, partner_name, phone_no),
  customer:partner!sales_order_customer_id_fkey(id, partner_name, phone_no),
  sales_order_item(quantity, item_price, deleted_at)
`;

export type ListFilters = {
  status?: OrderStatus | 'all';
  search?: string;
  /** YYYY-MM-DD — when set, filters to orders created on that day. */
  date?: string;
  /** Max rows to fetch. Defaults to 200. */
  limit?: number;
};

export async function fetchSalesOrders(filters: ListFilters): Promise<SalesOrder[]> {
  let q = supabase
    .from('sales_order')
    .select(ORDER_LIST_SELECT)
    .is('deleted_at', null)
    .order('order_date', { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status);
  }
  if (filters.search && filters.search.trim()) {
    // Filter client-side after fetch since PostgREST .or() can't filter on
    // joined tables. See applyTextSearch below.
  }
  if (filters.date) {
    q = q.gte('order_date', `${filters.date}T00:00:00`)
         .lt('order_date', `${filters.date}T23:59:59.999`);
  }

  const { data, error } = await q;
  if (error) throw new Error(`fetchSalesOrders: ${error.message}`);
  let rows = (data ?? []) as unknown as SalesOrder[];

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    rows = rows.filter((o) =>
      o.client?.partner_name?.includes(term) ||
      o.customer?.partner_name?.includes(term),
    );
  }
  return rows;
}

export async function fetchSalesOrdersWithLines(args: {
  since?: string;
  limit?: number;
} = {}): Promise<SalesOrder[]> {
  let q = supabase
    .from('sales_order')
    .select(ORDER_DETAIL_SELECT)
    .is('deleted_at', null)
    .order('order_date', { ascending: false })
    .limit(args.limit ?? 500);
  if (args.since) q = q.gte('order_date', args.since);
  const { data, error } = await q;
  if (error) throw new Error(`fetchSalesOrdersWithLines: ${error.message}`);
  return (data ?? []) as unknown as SalesOrder[];
}

export async function fetchSalesOrderById(id: string): Promise<SalesOrder> {
  const { data, error } = await supabase
    .from('sales_order')
    .select(ORDER_DETAIL_SELECT)
    .eq('id', id)
    .single();
  if (error) throw new Error(`fetchSalesOrderById: ${error.message}`);
  return data as unknown as SalesOrder;
}

export type NewOrderInput = {
  customer_id: string;
  site: string | null;
  description: string | null;
  lines: Array<{
    item_id: string;
    packaging_id: string | null;
    quantity: number;
    avg_cost: number; // captured at line-build time so we can compute unit_price
  }>;
};

export async function createSalesOrder(input: NewOrderInput): Promise<{ id: string }> {
  if (input.lines.length === 0) {
    throw new Error('createSalesOrder: order must have at least one line');
  }

  const { data: order, error: orderErr } = await supabase
    .from('sales_order')
    .insert({
      client_id: CLIENT_ID,
      customer_id: input.customer_id,
      site: input.site,
      description: input.description,
      status: 'o' as OrderStatus,
    })
    .select('id')
    .single();
  if (orderErr) throw new Error(`createSalesOrder: ${orderErr.message}`);

  const linesToInsert = input.lines.map((l) => ({
    sales_order_id: order.id,
    item_id: l.item_id,
    packaging_id: l.packaging_id,
    quantity: l.quantity,
    item_price: calcItemPrice(l.avg_cost),
    item_cost: l.avg_cost,
  }));

  const { error: linesErr } = await supabase
    .from('sales_order_item')
    .insert(linesToInsert);
  if (linesErr) {
    await supabase.from('sales_order').delete().eq('id', order.id);
    throw new Error(`createSalesOrder lines: ${linesErr.message}`);
  }

  return { id: order.id };
}

export async function updateSalesOrderLineQty(args: {
  orderId: string;
  lineId: string;
  quantity: number;
}): Promise<SalesOrderLine> {
  const { data, error } = await supabase
    .from('sales_order_item')
    .update({ quantity: args.quantity })
    .eq('id', args.lineId)
    .eq('sales_order_id', args.orderId)
    .select('*')
    .single();
  if (error) throw new Error(`updateSalesOrderLineQty: ${error.message}`);
  return data as unknown as SalesOrderLine;
}

export async function addSalesOrderLine(args: {
  orderId: string;
  item_id: string;
  packaging_id: string | null;
  quantity: number;
  avg_cost: number;
}): Promise<SalesOrderLine> {
  const { data, error } = await supabase
    .from('sales_order_item')
    .insert({
      sales_order_id: args.orderId,
      item_id: args.item_id,
      packaging_id: args.packaging_id,
      quantity: args.quantity,
      item_price: calcItemPrice(args.avg_cost),
      item_cost: args.avg_cost,
    })
    .select('*')
    .single();
  if (error) throw new Error(`addSalesOrderLine: ${error.message}`);
  return data as unknown as SalesOrderLine;
}

export async function deleteSalesOrderLine(args: {
  orderId: string;
  lineId: string;
}): Promise<void> {
  const { error } = await supabase
    .from('sales_order_item')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', args.lineId)
    .eq('sales_order_id', args.orderId);
  if (error) throw new Error(`deleteSalesOrderLine: ${error.message}`);
}

export async function cancelSalesOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('sales_order')
    .update({ status: 'd' as OrderStatus })
    .eq('id', id);
  if (error) throw new Error(`cancelSalesOrder: ${error.message}`);
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('sales_order')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(`setOrderStatus(${status}): ${error.message}`);
}

export async function confirmOrderShipped(id: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_sales_order_shipped', { p_order_id: id });
  if (error) throw new Error(`confirmOrderShipped: ${error.message}`);
}
export const confirmOrderDelivered = (id: string) => setOrderStatus(id, 'c');
