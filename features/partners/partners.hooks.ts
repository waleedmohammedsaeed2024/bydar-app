import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

import {
  createCustomer,
  fetchAllCustomers,
  fetchClients,
  fetchCustomer,
  fetchCustomers,
  fetchSuppliers,
} from './partners.service';

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients(),
    queryFn: fetchClients,
    staleTime: 60_000,
  });
}

export function useCustomers(clientId: string | null) {
  return useQuery({
    queryKey: queryKeys.customers(clientId),
    queryFn: () => fetchCustomers(clientId!),
    enabled: !!clientId,
    staleTime: 60_000,
  });
}

export function useCustomer(id: string | null, clientId: string) {
  return useQuery({
    queryKey: queryKeys.customer(id ?? ''),
    queryFn: () => fetchCustomer(id!, clientId),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers(),
    queryFn: fetchSuppliers,
    staleTime: 60_000,
  });
}

export function useAllCustomers() {
  return useQuery({
    queryKey: queryKeys.customers('__all__'),
    queryFn: fetchAllCustomers,
    staleTime: 60_000,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.customers(vars.client_id) });
    },
  });
}
