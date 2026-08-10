import type { InventoryItem, OrderStatus, Packaging, SalesOrderLine } from './database.types';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  o: 'مفتوح',
  p: 'قيد التوصيل',
  c: 'تم التسليم',
  d: 'ملغى',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  o: '#a48a3e', // amber — open / awaiting
  p: '#2d5a8a', // blue — in transit
  c: '#3e6b4a', // green — delivered
  d: '#8a3e3e', // red — cancelled
};

export const STATUS_FILTERS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'o', label: 'الطلبات' },
  { key: 'p', label: 'قيد التوصيل' },
  { key: 'c', label: 'تم التسليم' },
  { key: 'd', label: 'ملغى' },
];

// TODO: confirm the formula with the web `calcItemPrice`. Plan §4 says line
// price is derived from inventory_item.avg_cost — we keep the simplest
// honest form here (line unit_price === avg_cost). Adjust once the web
// repo's implementation is available.
export function calcItemPrice(avgCost: number, _packagingUnitCount = 1): number {
  return avgCost;
}

export function lineTotal(line: Pick<SalesOrderLine, 'item_price' | 'quantity'>): number {
  return line.item_price * line.quantity;
}

export function orderTotal(lines: SalesOrderLine[] | undefined | null): number {
  if (!lines) return 0;
  return lines
    .filter((l) => !l.deleted_at)
    .reduce((s, l) => s + l.item_price * l.quantity, 0);
}

export function itemPackagings(item: InventoryItem | undefined | null): Packaging[] {
  if (!item?.item_packaging) return [];
  return item.item_packaging
    .map((ip) => ip.packaging)
    .filter((p): p is Packaging => !!p);
}

export function shortOrderId(id: string): string {
  return `#${id.slice(0, 6)}`;
}

/** Quantities step by 1 (whole) or 0.5 (half) — never finer. */
export const QTY_STEPS = [1, 0.5] as const;
export type QtyStep = (typeof QTY_STEPS)[number];

export function isHalfStep(q: number): boolean {
  return Number.isFinite(q) && Number.isInteger(q * 2);
}

/** "2" / "2.5" — always Latin digits, at most one decimal place. */
export function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(1);
}

/** Splits a quantity for display: integer part bold, fraction light. */
export function splitQty(q: number): { int: string; frac: string | null } {
  const [int, frac] = formatQty(q).split('.');
  return { int, frac: frac ? `.${frac}` : null };
}

export function stepQty(current: number, step: QtyStep, dir: 1 | -1): number {
  const next = Math.round((current + step * dir) * 2) / 2;
  return Math.max(step, next);
}

/** Snaps a quantity to the given step — used when toggling half → whole. */
export function snapQty(q: number, step: QtyStep): number {
  if (step === 0.5) return Math.max(0.5, Math.round(q * 2) / 2);
  return Math.max(1, Math.round(q));
}

export function formatCurrency(n: number, locale = 'ar-SA-u-nu-latn', currency = 'SAR'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 })
      .format(n);
  } catch {
    return `${n.toFixed(2)} ر.س`;
  }
}

export function formatDate(iso: string, locale = 'ar-SA-u-nu-latn'): string {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}
