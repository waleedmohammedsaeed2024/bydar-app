import { supabase } from '@/lib/supabase';
import type { Partner } from '@/lib/database.types';

const PARTNER_COLUMNS = 'id, partner_name, partner_type, parent_client_id, phone_no, balance';

export async function fetchClients(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partner')
    .select(PARTNER_COLUMNS)
    .eq('partner_type', 'u')
    .is('parent_client_id', null)
    .is('deleted_at', null)
    .order('partner_name');
  if (error) throw new Error(`fetchClients: ${error.message}`);
  return (data ?? []) as Partner[];
}

export async function fetchCustomers(clientId: string): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partner')
    .select(PARTNER_COLUMNS)
    .eq('partner_type', 'u')
    .eq('parent_client_id', clientId)
    .is('deleted_at', null)
    .order('partner_name');
  if (error) throw new Error(`fetchCustomers: ${error.message}`);
  return (data ?? []) as Partner[];
}

export async function fetchCustomer(id: string, clientId: string): Promise<Partner | null> {
  const { data, error } = await supabase
    .from('partner')
    .select(PARTNER_COLUMNS)
    .eq('id', id)
    .eq('partner_type', 'u')
    .eq('parent_client_id', clientId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(`fetchCustomer: ${error.message}`);
  return (data ?? null) as Partner | null;
}

export async function createCustomer(input: {
  partner_name: string;
  phone_no: string | null;
  client_id: string;
}): Promise<Partner> {
  const { data, error } = await supabase
    .from('partner')
    .insert({
      partner_name: input.partner_name,
      phone_no: input.phone_no,
      partner_type: 'u',
      parent_client_id: input.client_id,
    })
    .select(PARTNER_COLUMNS)
    .single();
  if (error) throw new Error(`createCustomer: ${error.message}`);
  return data as Partner;
}

export async function fetchSuppliers(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partner')
    .select(PARTNER_COLUMNS)
    .eq('partner_type', 's')
    .is('deleted_at', null)
    .order('partner_name');
  if (error) throw new Error(`fetchSuppliers: ${error.message}`);
  return (data ?? []) as Partner[];
}

// All partners with partner_type='c' — the schema doesn't separate
// "clients" from "customers" beyond the parent_client_id hierarchy, so we
// return every customer-type partner and let the UI sort it out.
export async function fetchAllCustomers(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partner')
    .select(PARTNER_COLUMNS)
    .eq('partner_type', 'u')
    .is('deleted_at', null)
    .order('partner_name');
  if (error) throw new Error(`fetchAllCustomers: ${error.message}`);
  return (data ?? []) as Partner[];
}
