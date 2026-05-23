export type AppRole =
  | 'admin'
  | 'manager'
  | 'accountant'
  | 'purchase'
  | 'salesman'
  | 'customer';

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  purchase: 'مشتريات',
  salesman: 'مندوب مبيعات',
  customer: 'عميل',
};

export type Permission =
  | 'view_dashboard'
  | 'view_reports'
  | 'create_order'
  | 'read_orders'
  | 'deliver_own_order'
  | 'create_purchase'
  | 'read_purchases'
  | 'update_purchases'
  | 'view_stock'
  | 'create_items'
  | 'read_items'
  | 'create_customers'
  | 'read_customers'
  | 'view_reviews'
  | 'create_reviews'
  | 'manage_users';

const ALL: Permission[] = [
  'view_dashboard', 'view_reports', 'create_order', 'read_orders',
  'deliver_own_order', 'create_purchase', 'read_purchases', 'update_purchases',
  'view_stock', 'create_items', 'read_items', 'create_customers',
  'read_customers', 'view_reviews', 'create_reviews', 'manage_users',
];

const MATRIX: Record<AppRole, Set<Permission>> = {
  admin: new Set(ALL),

  manager: new Set<Permission>([
    'view_dashboard', 'view_reports',
    'read_orders', 'read_purchases',
    'view_stock', 'read_items', 'read_customers', 'view_reviews',
  ]),

  accountant: new Set<Permission>([
    'view_dashboard', 'view_reports',
    'read_orders', 'read_purchases',
    'view_stock', 'read_items', 'read_customers', 'view_reviews',
  ]),

  purchase: new Set<Permission>([
    'view_dashboard', 'view_reports',
    'read_orders',
    'create_purchase', 'read_purchases', 'update_purchases',
    'view_stock', 'read_items', 'read_customers',
  ]),

  salesman: new Set<Permission>([
    'view_dashboard', 'view_reports',
    'read_orders', 'read_items', 'read_customers',
  ]),

  customer: new Set<Permission>([
    'view_dashboard', 'view_reports',
    'create_order', 'read_orders', 'deliver_own_order',
    'read_items',
    'view_reviews', 'create_reviews',
  ]),
};

export function can(role: AppRole | null | undefined, perm: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.has(perm) ?? false;
}

export function resolveRole(raw: unknown): AppRole {
  const valid: AppRole[] = [
    'admin', 'manager', 'accountant', 'purchase', 'salesman', 'customer',
  ];
  if (typeof raw === 'string' && (valid as string[]).includes(raw)) return raw as AppRole;
  return 'customer';
}
