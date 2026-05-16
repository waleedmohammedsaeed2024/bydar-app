import { useQuery } from '@tanstack/react-query';

import type { Privileges } from '@/lib/database.types';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

const ALL_FALSE: Privileges = {
  createOrders: false,
  cancelInvoice: false,
  confirmDelivery: false,
  salesmanShipToDelivered: false,
  shipOrders: false,
};

// Plan §4: gate UI on `public.my_privileges()`. Returns a flat object of flags.
// If the RPC isn't present yet, fall back to all-false so the UI stays safe.
async function fetchPrivileges(): Promise<Privileges> {
  const { data, error } = await supabase.rpc('my_privileges');
  if (error) {
    // TODO: tighten to throw once the RPC is guaranteed to exist on staging.
    if (__DEV__) console.warn('my_privileges RPC missing or failing:', error.message);
    return ALL_FALSE;
  }
  return { ...ALL_FALSE, ...(data as Partial<Privileges> | null) };
}

export function usePrivileges() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: queryKeys.privileges,
    queryFn: fetchPrivileges,
    enabled: !!session,
    staleTime: 5 * 60_000,
  });
}

export function canConfirmDelivery(p?: Privileges): boolean {
  return !!(p?.confirmDelivery || p?.salesmanShipToDelivered);
}
