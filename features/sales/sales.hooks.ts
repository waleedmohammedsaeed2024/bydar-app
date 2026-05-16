import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OrderStatus } from '@/lib/database.types';
import { queryKeys } from '@/lib/query-keys';

import {
  addSalesOrderLine,
  cancelSalesOrder,
  confirmOrderDelivered,
  confirmOrderShipped,
  createSalesOrder,
  deleteSalesOrderLine,
  fetchSalesOrderById,
  fetchSalesOrders,
  fetchSalesOrdersWithLines,
  updateSalesOrderLineQty,
  type ListFilters,
  type NewOrderInput,
} from './sales.service';

export function useSalesOrders(filters: ListFilters) {
  return useQuery({
    queryKey: queryKeys.salesOrders(filters),
    queryFn: () => fetchSalesOrders(filters),
  });
}

export function useSalesOrdersWithLines(args: { since?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['salesOrders', 'withLines', args],
    queryFn: () => fetchSalesOrdersWithLines(args),
    staleTime: 60_000,
  });
}

export function useSalesOrder(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.salesOrder(id) : ['salesOrders', 'detail', 'noop'],
    queryFn: () => fetchSalesOrderById(id!),
    enabled: !!id,
  });
}

function invalidateOrderLists(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['salesOrders'] });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewOrderInput) => createSalesOrder(input),
    onSuccess: () => invalidateOrderLists(qc),
  });
}

export function useUpdateLineQty(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { lineId: string; quantity: number }) =>
      updateSalesOrderLineQty({ orderId, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrder(orderId) });
      invalidateOrderLists(qc);
    },
  });
}

export function useAddLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      item_id: string;
      packaging_id: string | null;
      quantity: number;
      avg_cost: number;
    }) => addSalesOrderLine({ orderId, ...args }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrder(orderId) });
      invalidateOrderLists(qc);
    },
  });
}

export function useDeleteLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) => deleteSalesOrderLine({ orderId, lineId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrder(orderId) });
      invalidateOrderLists(qc);
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSalesOrder(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrder(id) });
      invalidateOrderLists(qc);
    },
  });
}

export function useConfirmOrderShipped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmOrderShipped(id),
    // Optimistic flip per plan §6.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.salesOrder(id) });
      const prev = qc.getQueryData<{ status: OrderStatus }>(queryKeys.salesOrder(id));
      if (prev) qc.setQueryData(queryKeys.salesOrder(id), { ...prev, status: 'p' });
      return { prev };
    },
    onError: (_e, id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.salesOrder(id), ctx.prev);
    },
    onSettled: (_d, _e, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrder(id) });
      invalidateOrderLists(qc);
    },
  });
}

export function useConfirmOrderDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmOrderDelivered(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.salesOrder(id) });
      const prev = qc.getQueryData<{ status: OrderStatus }>(queryKeys.salesOrder(id));
      if (prev) qc.setQueryData(queryKeys.salesOrder(id), { ...prev, status: 'c' });
      return { prev };
    },
    onError: (_e, id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.salesOrder(id), ctx.prev);
    },
    onSettled: (_d, _e, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.salesOrder(id) });
      invalidateOrderLists(qc);
    },
  });
}
