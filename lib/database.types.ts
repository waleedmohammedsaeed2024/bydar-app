// TODO: replace with generated types from `supabase gen types typescript`
// against the bydar ERP project. These hand-written shapes match the plan's
// §4 description; column names should be reconciled with the web repo's
// `src/lib/database.types.ts` before the mobile app ships.

export type OrderStatus = 'o' | 'p' | 'c' | 'd';

export type Partner = {
  id: string;
  partner_name: string;
  partner_type: 'c' | 'u' | 's'; // u=customer (under a client), c=top-level client/tenant, s=supplier
  parent_client_id: string | null;
  phone_no: string | null;
  balance: number;
  created_at?: string;
};

export type Packaging = {
  id: string;
  pack_arab: string;
  pack_eng: string | null;
};

export type ItemPackaging = {
  item_id: string;
  packaging_id: string;
  packaging?: Packaging | null;
};

export type InventoryItem = {
  id: string;
  item_name: string;
  item_english_name: string | null;
  item_image: string | null;
  avg_cost: number;
  quantity: number;
  orderpoint: number;
  item_packaging?: ItemPackaging[];
};

export type SalesOrderLine = {
  id: string;
  sales_order_id: string;
  item_id: string;
  packaging_id: string | null;
  quantity: number;
  item_price: number;
  item_cost: number;
  deleted_at: string | null;
  item?: InventoryItem | null;
  packaging?: Packaging | null;
};

export type SalesOrder = {
  id: string;
  order_date: string;
  client_id: string;
  customer_id: string;
  site: string | null;
  description: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  client?: Partner | null;
  customer?: Partner | null;
  sales_order_item?: SalesOrderLine[];
};

export type PurchaseInvoiceItem = {
  id: string;
  purchase_invoice_id: string;
  item_id: string;
  packaging_id: string | null;
  quantity: number;
  item_cost: number;
  repack_factor: number;
  description: string | null;
  deleted_at: string | null;
  item?: InventoryItem | null;
  packaging?: Packaging | null;
};

export type PurchaseInvoice = {
  id: string;
  invoice_no: string;
  invoice_date: string;
  supplier_id: string;
  supplier_inv_no: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Partner | null;
  purchase_invoice_item?: PurchaseInvoiceItem[];
};

export type Privileges = {
  createOrders: boolean;
  cancelInvoice: boolean;
  confirmDelivery: boolean;
  salesmanShipToDelivered: boolean;
  shipOrders: boolean;
};
