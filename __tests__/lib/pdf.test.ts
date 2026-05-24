import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SalesOrder } from '@/lib/database.types';
import {
  buildDeliveryNoteHtml,
  printOrShareDeliveryNotePDF,
} from '@/lib/pdf';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
  printAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const mockedPrint = Print as jest.Mocked<typeof Print>;
const mockedSharing = Sharing as jest.Mocked<typeof Sharing>;

function makeOrder(overrides: Partial<SalesOrder> = {}): SalesOrder {
  return {
    id: 'abcdef1234567890-fake-order-id',
    order_date: '2026-05-24T10:15:00.000Z',
    client_id: 'client-uuid',
    customer_id: 'customer-uuid',
    site: 'بريدة - حي الصفراء',
    description: null,
    status: 'o',
    created_at: '2026-05-24T10:15:00.000Z',
    updated_at: '2026-05-24T10:15:00.000Z',
    client: {
      id: 'client-uuid',
      partner_name: 'مؤسسة العميل الأم',
      partner_type: 'c',
      parent_client_id: null,
      phone_no: '0500000000',
      balance: 0,
    },
    customer: {
      id: 'customer-uuid',
      partner_name: 'متجر القصيم',
      partner_type: 'u',
      parent_client_id: 'client-uuid',
      phone_no: '0551234567',
      balance: 0,
    },
    sales_order_item: [
      {
        id: 'line-1',
        sales_order_id: 'abcdef1234567890-fake-order-id',
        item_id: 'item-1',
        packaging_id: 'pack-1',
        quantity: 5,
        item_price: 12.5,
        item_cost: 10,
        deleted_at: null,
        item: {
          id: 'item-1',
          item_name: 'دقيق فاخر',
          item_english_name: 'Premium Flour',
          item_image: null,
          avg_cost: 10,
          quantity: 100,
          orderpoint: 10,
        },
        packaging: { id: 'pack-1', pack_arab: 'كيس', pack_eng: 'Bag' },
      },
      {
        id: 'line-2',
        sales_order_id: 'abcdef1234567890-fake-order-id',
        item_id: 'item-2',
        packaging_id: 'pack-2',
        quantity: 3,
        item_price: 20,
        item_cost: 18,
        deleted_at: null,
        item: {
          id: 'item-2',
          item_name: 'سكر',
          item_english_name: null,
          item_image: null,
          avg_cost: 18,
          quantity: 50,
          orderpoint: 5,
        },
        packaging: { id: 'pack-2', pack_arab: 'كرتون', pack_eng: 'Carton' },
      },
    ],
    ...overrides,
  };
}

describe('buildDeliveryNoteHtml', () => {
  it('returns a non-empty HTML5 document', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    expect(html).toEqual(expect.any(String));
    expect(html.length).toBeGreaterThan(500);
    expect(html.toLowerCase()).toContain('<!doctype html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('embeds the delivery-note doc number derived from order id (first 8 chars, upper)', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    expect(html).toContain('DN-ABCDEF12');
  });

  it('embeds the order reference derived from order id (first 6 chars, upper)', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    expect(html).toContain('ABCDEF');
  });

  it('formats the order_date as DD/MM/YYYY', () => {
    const html = buildDeliveryNoteHtml(
      makeOrder({ order_date: '2026-01-09T00:00:00.000Z' }),
    );
    expect(html).toContain('09/01/2026');
  });

  it('renders the customer name and customer phone when present', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    expect(html).toContain('متجر القصيم');
    expect(html).toContain('0551234567');
  });

  it('falls back to client name + client phone when customer is missing', () => {
    const html = buildDeliveryNoteHtml(
      makeOrder({ customer: null }),
    );
    expect(html).toContain('مؤسسة العميل الأم');
    expect(html).toContain('0500000000');
  });

  it('uses site as the reference; falls back to description when site is null', () => {
    const withSite = buildDeliveryNoteHtml(
      makeOrder({ site: 'موقع التسليم', description: 'desc-ignored' }),
    );
    expect(withSite).toContain('موقع التسليم');

    const withDescription = buildDeliveryNoteHtml(
      makeOrder({ site: null, description: 'وصف بديل' }),
    );
    expect(withDescription).toContain('وصف بديل');
  });

  it('renders one table row per non-deleted line', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    const rowCount = (html.match(/<tr>/g) ?? []).length;
    // 1 header row + 2 body rows
    expect(rowCount).toBe(3);
  });

  it('filters out soft-deleted lines (deleted_at != null)', () => {
    const order = makeOrder();
    order.sales_order_item![1].deleted_at = '2026-05-24T11:00:00.000Z';
    const html = buildDeliveryNoteHtml(order);
    expect(html).toContain('دقيق فاخر');
    expect(html).not.toContain('سكر');
    const rowCount = (html.match(/<tr>/g) ?? []).length;
    expect(rowCount).toBe(2); // header + 1 body
  });

  it('renders the Arabic and English item names when both are provided', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    expect(html).toContain('دقيق فاخر');
    expect(html).toContain('Premium Flour');
  });

  it('omits the English block when item_english_name is missing or blank', () => {
    const order = makeOrder();
    order.sales_order_item = [order.sales_order_item![1]]; // English name = null
    const html = buildDeliveryNoteHtml(order);
    expect(html).toContain('سكر');
    expect(html).not.toMatch(/Premium Flour/);
  });

  it('prefers Arabic packaging label; falls back to English when pack_arab is nullish', () => {
    const order = makeOrder();
    order.sales_order_item![0].packaging = {
      id: 'p',
      pack_arab: null as unknown as string,
      pack_eng: 'Bag',
    };
    const html = buildDeliveryNoteHtml(order);
    expect(html).toContain('Bag');
  });

  it('computes summary totals (total items + total qty)', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    // total items = 2 lines, total qty = 5 + 3 = 8
    expect(html).toMatch(/>\s*2\s*</);
    expect(html).toMatch(/>\s*8\s*</);
  });

  it('shows "—" placeholders in the summary when there are no items', () => {
    const order = makeOrder({ sales_order_item: [] });
    const html = buildDeliveryNoteHtml(order);
    expect(html).toContain('—');
  });

  it('escapes HTML in user-supplied fields (no raw < > & " injection)', () => {
    const order = makeOrder({
      customer: {
        id: 'x',
        partner_name: '<script>alert(1)</script> & "co"',
        partner_type: 'u',
        parent_client_id: 'client-uuid',
        phone_no: null,
        balance: 0,
      },
      site: 'A & B <hack>',
    });
    const html = buildDeliveryNoteHtml(order);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;co&quot;');
    expect(html).toContain('A &amp; B &lt;hack&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('includes the Bydar Najd brand block and legal identifiers', () => {
    const html = buildDeliveryNoteHtml(makeOrder());
    expect(html).toContain('BYDAR NAJD EST.');
    expect(html).toContain('مؤسسة بيدر نجد');
    expect(html).toContain('VAT NO.');
    expect(html).toContain('314223776600003');
    expect(html).toContain('C.R. NO.');
    expect(html).toContain('7051629223');
    expect(html).toContain('DELIVERY NOTE');
    expect(html).toContain('إذن تسليم بضاعة');
  });

  it('does not crash and renders an empty body when sales_order_item is undefined', () => {
    const order = makeOrder({ sales_order_item: undefined });
    const html = buildDeliveryNoteHtml(order);
    expect(html).toContain('<tbody>');
    expect(html).toContain('</tbody>');
    const rowCount = (html.match(/<tr>/g) ?? []).length;
    expect(rowCount).toBe(1); // header only
  });
});

describe('printOrShareDeliveryNotePDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders HTML via Print.printToFileAsync and opens the share sheet when sharing is available', async () => {
    mockedPrint.printToFileAsync.mockResolvedValue({
      uri: 'file:///tmp/delivery-note.pdf',
    } as Awaited<ReturnType<typeof Print.printToFileAsync>>);
    mockedSharing.isAvailableAsync.mockResolvedValue(true);
    mockedSharing.shareAsync.mockResolvedValue(undefined as never);

    const order = makeOrder();
    await printOrShareDeliveryNotePDF(order);

    expect(mockedPrint.printToFileAsync).toHaveBeenCalledTimes(1);
    const callArg = mockedPrint.printToFileAsync.mock.calls[0][0] as {
      html: string;
    };
    expect(callArg.html).toContain('DELIVERY NOTE');
    expect(callArg.html).toContain('متجر القصيم');

    expect(mockedSharing.shareAsync).toHaveBeenCalledTimes(1);
    expect(mockedSharing.shareAsync).toHaveBeenCalledWith(
      'file:///tmp/delivery-note.pdf',
      {
        mimeType: 'application/pdf',
        dialogTitle: expect.stringContaining('إذن تسليم'),
        UTI: 'com.adobe.pdf',
      },
    );
    expect(mockedPrint.printAsync).not.toHaveBeenCalled();
  });

  it('falls back to Print.printAsync when sharing is not available', async () => {
    mockedPrint.printToFileAsync.mockResolvedValue({
      uri: 'file:///tmp/delivery-note.pdf',
    } as Awaited<ReturnType<typeof Print.printToFileAsync>>);
    mockedSharing.isAvailableAsync.mockResolvedValue(false);
    mockedPrint.printAsync.mockResolvedValue(undefined as never);

    await printOrShareDeliveryNotePDF(makeOrder());

    expect(mockedSharing.shareAsync).not.toHaveBeenCalled();
    expect(mockedPrint.printAsync).toHaveBeenCalledTimes(1);
    const callArg = mockedPrint.printAsync.mock.calls[0][0] as {
      html: string;
    };
    expect(callArg.html).toContain('DELIVERY NOTE');
  });

  it('uses the short order id (first 6 chars, uppercased with leading #) in the share dialog title', async () => {
    mockedPrint.printToFileAsync.mockResolvedValue({
      uri: 'file:///tmp/x.pdf',
    } as Awaited<ReturnType<typeof Print.printToFileAsync>>);
    mockedSharing.isAvailableAsync.mockResolvedValue(true);
    mockedSharing.shareAsync.mockResolvedValue(undefined as never);

    await printOrShareDeliveryNotePDF(makeOrder());

    const opts = mockedSharing.shareAsync.mock.calls[0][1] as {
      dialogTitle: string;
    };
    // shortOrderId returns the raw first 6 chars (not upper-cased) prefixed with '#'
    expect(opts.dialogTitle).toContain('#abcdef');
  });

  it('propagates errors from Print.printToFileAsync', async () => {
    mockedPrint.printToFileAsync.mockRejectedValue(new Error('print boom'));

    await expect(printOrShareDeliveryNotePDF(makeOrder())).rejects.toThrow(
      'print boom',
    );
    expect(mockedSharing.isAvailableAsync).not.toHaveBeenCalled();
    expect(mockedSharing.shareAsync).not.toHaveBeenCalled();
  });
});
