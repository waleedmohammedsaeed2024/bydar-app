import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SalesOrder } from '@/lib/database.types';
import { ORDER_STATUS_LABEL, formatDate, shortOrderId } from '@/lib/utils';

export function buildOrderHtml(order: SalesOrder): string {
  const lines = (order.sales_order_item ?? []).filter((l) => !l.deleted_at);
  const rows = lines.map((l) => {
    const name = l.item?.item_name ?? '—';
    const pkg = l.packaging?.pack_arab ?? '';
    return `
      <tr>
        <td>${escapeHtml(name)}${pkg ? `<br/><small>${escapeHtml(pkg)}</small>` : ''}</td>
        <td class="num">${l.quantity}</td>
      </tr>`;
  }).join('');

  const client = order.client?.partner_name ?? '—';
  const customer = order.customer?.partner_name ?? '—';
  const orderRef = shortOrderId(order.id);

  return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f3326; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #6a7a6e; font-size: 12px; margin-bottom: 18px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
  .grid div { background: #f3f5ee; border-radius: 10px; padding: 10px 12px; }
  .grid b { display: block; color: #6a7a6e; font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 8px 10px; text-align: right; border-bottom: 1px solid rgba(31,51,38,0.12); }
  th { background: #1d3f2a; color: #fff; font-weight: 700; }
  td.num, th.num { text-align: left; direction: ltr; }
  tfoot td { font-weight: 700; font-size: 14px; border-top: 2px solid #1d3f2a; }
  .status { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #1d3f2a; color: #fff; font-size: 11px; }
</style>
</head>
<body>
  <h1>طلب مبيعات ${escapeHtml(orderRef)}</h1>
  <div class="meta">
    ${formatDate(order.order_date)} ·
    <span class="status">${ORDER_STATUS_LABEL[order.status]}</span>
  </div>
  <div class="grid">
    <div><b>العميل</b>${escapeHtml(client)}</div>
    <div><b>الزبون</b>${escapeHtml(customer)}</div>
    ${order.site ? `<div><b>الموقع</b>${escapeHtml(order.site)}</div>` : ''}
    ${order.description ? `<div><b>ملاحظات</b>${escapeHtml(order.description)}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr><th>الصنف</th><th class="num">الكمية</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="2" style="text-align:center;color:#6a7a6e">لا توجد أصناف</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function printOrCloseOrderPDF(order: SalesOrder): Promise<void> {
  const html = buildOrderHtml(order);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `طلب ${shortOrderId(order.id)}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    // Fallback: directly print on supported devices.
    await Print.printAsync({ html });
  }
}
