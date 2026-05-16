import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

import { fetchItem, fetchItemStocks, fetchItems } from './items.service';

export function useItems(search?: string) {
  return useQuery({
    queryKey: queryKeys.items(search),
    queryFn: () => fetchItems(search),
    staleTime: 60_000,
  });
}

export function useItemStocks(itemIds: string[]) {
  const key = [...itemIds].sort().join(',');
  return useQuery({
    queryKey: ['items', 'stocks', key],
    queryFn: () => fetchItemStocks(itemIds),
    enabled: itemIds.length > 0,
    staleTime: 30_000,
  });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.item(id) : ['items', 'detail', 'noop'],
    queryFn: () => fetchItem(id!),
    enabled: !!id,
  });
}
