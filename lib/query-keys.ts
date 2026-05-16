import type { OrderStatus } from './database.types';

export const queryKeys = {
  privileges: ['privileges'] as const,

  salesOrders: (
    filters: { status?: OrderStatus | 'all'; search?: string; date?: string; limit?: number } = {},
  ) => ['salesOrders', filters] as const,
  salesOrder: (id: string) => ['salesOrders', 'detail', id] as const,

  clients: () => ['partners', 'clients'] as const,
  customers: (clientId: string | null) => ['partners', 'customers', clientId] as const,
  customer: (id: string) => ['partners', 'customers', 'detail', id] as const,

  items: (search?: string) => ['items', search ?? ''] as const,
  item: (id: string) => ['items', 'detail', id] as const,

  suppliers: () => ['partners', 'suppliers'] as const,

  purchaseInvoices: (filters: { search?: string; date?: string; limit?: number } = {}) =>
    ['purchaseInvoices', filters] as const,
  purchaseInvoice: (id: string) => ['purchaseInvoices', 'detail', id] as const,
};
