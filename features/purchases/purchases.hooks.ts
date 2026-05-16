import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

import {
  createPurchaseInvoice,
  fetchPurchaseInvoiceById,
  fetchPurchaseInvoices,
  type NewPurchaseInput,
  type PIFilters,
} from './purchases.service';

export function usePurchaseInvoices(filters: PIFilters = {}) {
  return useQuery({
    queryKey: queryKeys.purchaseInvoices(filters),
    queryFn: () => fetchPurchaseInvoices(filters),
  });
}

export function usePurchaseInvoice(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.purchaseInvoice(id) : ['purchaseInvoices', 'detail', 'noop'],
    queryFn: () => fetchPurchaseInvoiceById(id!),
    enabled: !!id,
  });
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPurchaseInput) => createPurchaseInvoice(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      // Stock counts and per-item cached lists need refreshing too.
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
