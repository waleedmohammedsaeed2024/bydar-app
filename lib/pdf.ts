import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SalesOrder } from '@/lib/database.types';
import { ORDER_STATUS_LABEL, formatDate, shortOrderId } from '@/lib/utils';

export function buildDeliveryNoteHtml(order: SalesOrder): string {
  const lines = (order.sales_order_item ?? []).filter((l) => !l.deleted_at);

  // Document identifiers
  const noteNo   = `DN-${order.id.slice(0, 8).toUpperCase()}`;
  const orderRef = order.id.slice(0, 6).toUpperCase();

  // Date → DD/MM/YYYY
  const d = new Date(order.order_date);
  const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  // Recipient fields
  const customerName = order.customer?.partner_name ?? order.client?.partner_name ?? '';
  const phone        = order.customer?.phone_no ?? order.client?.phone_no ?? '';
  const reference    = order.site ?? order.description ?? '';

  // Totals
  const totalItems = lines.length;
  const totalQty   = lines.reduce((sum, l) => sum + l.quantity, 0);

  const itemRows = lines.map((l, i) => {
    const nameAr = l.item?.item_name ?? '';
    const nameEn = l.item?.item_english_name?.trim() ?? '';
    const unit   = l.packaging?.pack_arab ?? l.packaging?.pack_eng ?? '';
    const descCell = nameEn
      ? `<span style="display:block;direction:rtl">${escapeHtml(nameAr)}</span><span style="display:block;direction:ltr;text-align:right;font-size:10.5px;color:#6b6b6b;margin-top:2px">${escapeHtml(nameEn)}</span>`
      : escapeHtml(nameAr);
    return `<tr>
        <td class="col-no">${i + 1}</td>
        <td></td>
        <td style="line-height:1.3">${descCell}</td>
        <td style="text-align:center;direction:ltr">${l.quantity}</td>
        <td style="text-align:center">${escapeHtml(unit)}</td>
        <td></td>
      </tr>`;
  });
  const tableRows = itemRows.join('\n');

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<title>Delivery Note — ${escapeHtml(noteNo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  /* ── Print page ── */
  @page { size: A4; margin: 0; }

  :root{
    --green-900:#1f3a26;
    --gold:#c9a35a;
    --gold-soft:#e7d6a8;
    --cream:#f6efdc;
    --cream-2:#fbf6e6;
    --paper:#ffffff;
    --ink:#1a1a1a;
    --muted:#6b6b6b;
    --rule:#d9d2bf;
    --rule-soft:#ece6d2;
  }

  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#ffffff;font-family:"Noto Sans Arabic",sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}

  .page{
    width:794px;
    min-height:1123px;
    margin:0 auto;
    background:var(--paper);
    position:relative;
    padding:36px 40px 28px;
    overflow:hidden;
  }

  /* Watermark */
  .watermark{
    position:absolute;inset:0;
    background-image:
      repeating-linear-gradient(45deg,rgba(31,58,38,.04) 0 1px,transparent 1px 28px),
      repeating-linear-gradient(-45deg,rgba(31,58,38,.04) 0 1px,transparent 1px 28px);
    pointer-events:none;
    z-index:0;
  }
  .page > *:not(.watermark){position:relative;z-index:1}

  /* ── HEADER ── */
  .header{
    display:grid;
    grid-template-columns:1fr auto;
    align-items:start;
    gap:24px;
    padding-bottom:18px;
    border-bottom:1.5px solid var(--green-900);
  }
  .meta{
    display:grid;
    grid-template-columns:auto 1fr;
    row-gap:4px;
    column-gap:14px;
    align-items:center;
    font-size:12px;
    max-width:360px;
  }
  .meta .lbl{font-weight:700;letter-spacing:.08em;color:var(--green-900);font-size:11px}
  .meta .val{background:transparent;border:none;padding:2px 0;font-weight:600;color:var(--ink);font-size:12px;letter-spacing:.02em}

  .brand{display:flex;align-items:center;gap:12px;margin-top:-6px}
  .brand-text{text-align:right;direction:rtl}
  .brand-text .ar{font-family:"Noto Sans Arabic",sans-serif;font-size:22px;font-weight:800;color:var(--green-900);line-height:1}
  .brand-text .en{font-size:16px;font-weight:700;color:var(--green-900);letter-spacing:.04em;margin-top:6px;direction:ltr;text-align:right}

  .logo{
    width:54px;height:54px;
    border-radius:50%;
    background:var(--green-900);
    display:flex;align-items:center;justify-content:center;
    flex-shrink:0;
    box-shadow:0 2px 8px rgba(31,58,38,.18);
  }
  .logo svg{width:30px;height:30px}

  /* ── TITLE BAR ── */
  .title-bar{
    margin-top:22px;
    background:transparent;
    color:var(--green-900);
    padding:12px 0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    border-top:1px solid var(--rule);
    border-bottom:1px solid var(--rule);
  }
  .title-bar .en{letter-spacing:.22em;font-weight:700;font-size:15px;color:var(--green-900)}
  .title-bar .ar{font-family:"Noto Sans Arabic",sans-serif;font-size:20px;font-weight:700;direction:rtl;color:var(--green-900)}

  /* ── INFO CARDS ── */
  .info-row{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .card{background:var(--cream);border:1px solid var(--rule-soft);border-radius:6px;padding:14px 16px}
  .card-head{
    display:flex;align-items:center;justify-content:space-between;
    padding-bottom:10px;border-bottom:1px solid var(--rule);margin-bottom:12px;
  }
  .card-head .en{font-size:11px;letter-spacing:.18em;font-weight:700;color:var(--green-900)}
  .card-head .ar{font-size:13px;font-weight:700;color:var(--green-900);direction:rtl;font-family:"Noto Sans Arabic",sans-serif}

  .field{
    display:grid;grid-template-columns:1fr auto;align-items:end;
    gap:10px;padding:8px 0 4px;border-bottom:1px dotted #bfb89f;margin-bottom:6px;min-height:28px;
  }
  .field .value{font-size:13px;font-weight:600;color:var(--ink)}
  .field .labels{text-align:right;direction:rtl;line-height:1.1}
  .field .labels .ar{font-size:12px;font-weight:600;color:var(--ink);display:block;font-family:"Noto Sans Arabic",sans-serif}
  .field .labels .en{font-size:9.5px;color:var(--muted);letter-spacing:.1em;display:block;direction:ltr;text-align:right;margin-top:2px}

  /* ── ITEMS TABLE ── */
  table.items{
    width:100%;border-collapse:separate;border-spacing:0;
    margin-top:18px;border:1px solid var(--rule);border-radius:6px;overflow:hidden;
    direction:rtl;
  }
  table.items thead th{
    background:var(--green-900);color:#fff;padding:12px 10px;
    font-size:11px;letter-spacing:.14em;font-weight:700;
    border-left:1px solid rgba(255,255,255,.12);
  }
  table.items thead th .ar{font-family:"Noto Sans Arabic",sans-serif;display:block;font-size:13px;letter-spacing:0;margin-bottom:3px}
  table.items thead th:last-child{border-left:none}
  table.items td{
    height:42px;padding:6px 10px;
    border-bottom:1px solid var(--rule-soft);border-left:1px solid var(--rule-soft);
    font-size:12px;
  }
  table.items td:last-child{border-left:none}
  table.items tbody tr:nth-child(even) td{background:var(--cream-2)}
  table.items tbody tr:last-child td{border-bottom:none}
  .col-no{width:42px;text-align:center;font-weight:700;color:var(--green-900)}

  /* ── SUMMARY ── */
  .summary-row{margin-top:16px;display:grid;grid-template-columns:1fr;gap:14px;break-inside:avoid;page-break-inside:avoid}
  .summary .field{min-height:26px}
  .summary .field .value{color:var(--green-900);font-weight:700}

  /* ── FOOTER ── */
  .footer{
    margin-top:28px;
    border-top:1.5px solid var(--green-900);
    padding-top:12px;
    display:flex;align-items:center;justify-content:space-between;
    font-size:11px;color:var(--green-900);
  }
  .footer .left b{letter-spacing:.18em}
  .footer .right{display:flex;align-items:center;gap:10px;direction:rtl}
  .footer .pin{
    width:18px;height:18px;border-radius:50%;background:var(--green-900);color:#fff;
    display:inline-flex;align-items:center;justify-content:center;font-size:11px;
  }
</style>
</head>
<body>

<div class="page">
  <div class="watermark"></div>

  <!-- HEADER -->
  <header class="header">
    <div class="meta">
      <div class="lbl">VAT NO.</div>
      <div class="val">314223776600003</div>
      <div class="lbl">C.R. NO.</div>
      <div class="val">7051629223</div>
      <div class="lbl">ADDRESS</div>
      <div class="val">Buraydah, Al-Qassim</div>
    </div>

    <div class="brand">
      <div class="brand-text">
        <div class="ar">مؤسسة بيدر نجد</div>
        <div class="en">BYDAR NAJD EST.</div>
      </div>
      <div class="logo" aria-label="Bydar Najd logo">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4 L30 12 L30 28 L20 36 L10 28 L10 12 Z" stroke="#c9a35a" stroke-width="1.5" fill="none"/>
          <path d="M20 8 L20 32 M14 14 L20 18 L26 14 M14 20 L20 24 L26 20 M14 26 L20 30 L26 26" stroke="#c9a35a" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </header>

  <!-- TITLE BAR -->
  <div class="title-bar">
    <div class="en">DELIVERY NOTE</div>
    <div class="ar">إذن تسليم بضاعة</div>
  </div>

  <!-- INFO CARDS -->
  <div class="info-row">
    <div class="card">
      <div class="card-head">
        <div class="en">DOCUMENT INFO</div>
        <div class="ar">بيانات الإذن</div>
      </div>
      <div class="field">
        <div class="value" style="direction:ltr">${escapeHtml(noteNo)}</div>
        <div class="labels"><span class="ar">رقم الإذن</span><span class="en">Note No.</span></div>
      </div>
      <div class="field">
        <div class="value" style="direction:ltr">${escapeHtml(dateStr)}</div>
        <div class="labels"><span class="ar">التاريخ</span><span class="en">Date</span></div>
      </div>
      <div class="field">
        <div class="value" style="direction:ltr">${escapeHtml(orderRef)}</div>
        <div class="labels"><span class="ar">رقم الطلب</span><span class="en">Order Ref.</span></div>
      </div>
      <div class="field">
        <div class="value">&nbsp;</div>
        <div class="labels"><span class="ar">المرجع</span><span class="en">Reference</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="en">RECIPIENT DETAILS</div>
        <div class="ar">بيانات المستلم</div>
      </div>
      <div class="field">
        <div class="value">${escapeHtml(customerName)}</div>
        <div class="labels"><span class="ar">اسم العميل</span><span class="en">Customer Name</span></div>
      </div>
      <div class="field">
        <div class="value">&nbsp;</div>
        <div class="labels"><span class="ar">الرقم الضريبي</span><span class="en">VAT Number</span></div>
      </div>
      <div class="field">
        <div class="value" style="direction:ltr">${escapeHtml(phone)}</div>
        <div class="labels"><span class="ar">رقم الجوال</span><span class="en">Mobile</span></div>
      </div>
      <div class="field">
        <div class="value">${escapeHtml(reference)}</div>
        <div class="labels"><span class="ar">عنوان التسليم</span><span class="en">Delivery Address</span></div>
      </div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items">
    <thead>
      <tr>
        <th style="width:42px"><span class="ar">م</span>NO</th>
        <th style="width:90px"><span class="ar">رمز الصنف</span>CODE</th>
        <th><span class="ar">وصف الصنف</span>DESCRIPTION</th>
        <th style="width:70px"><span class="ar">الكمية</span>QTY</th>
        <th style="width:80px"><span class="ar">الوحدة</span>UNIT</th>
        <th style="width:130px"><span class="ar">ملاحظات</span>NOTES</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summary-row">
    <div class="card summary" style="max-width:340px">
      <div class="card-head">
        <div class="en">SUMMARY</div>
        <div class="ar">الإجمالي</div>
      </div>
      <div class="field">
        <div class="value">${totalItems > 0 ? totalItems : '—'}</div>
        <div class="labels"><span class="ar">إجمالي الأصناف</span><span class="en">Total Items</span></div>
      </div>
      <div class="field">
        <div class="value">${totalQty > 0 ? totalQty : '—'}</div>
        <div class="labels"><span class="ar">إجمالي الكمية</span><span class="en">Total Qty</span></div>
      </div>
      <div class="field">
        <div class="value">—</div>
        <div class="labels"><span class="ar">عدد الطرود</span><span class="en">Packages</span></div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="left"><b>BYDAR NAJD EST.</b> &nbsp;·&nbsp; DN/2026</div>
    <div class="right">
      <span>Buraydah, Al-Qassim, KSA &nbsp;·&nbsp; بريدة، القصيم، المملكة العربية السعودية</span>
      <span class="pin">›</span>
    </div>
  </footer>
</div>

</body>
</html>`;
}

export async function printOrShareDeliveryNotePDF(order: SalesOrder): Promise<void> {
  const html = buildDeliveryNoteHtml(order);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `إذن تسليم — ${shortOrderId(order.id)}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ html });
  }
}

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
