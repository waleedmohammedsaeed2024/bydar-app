import { supabase } from '@/lib/supabase';
import type { InventoryItem } from '@/lib/database.types';

const ITEM_COLUMNS = `
  id, item_name, item_english_name, item_image, avg_cost, quantity, orderpoint,
  item_packaging(item_id, packaging_id, packaging:packaging(id, pack_arab, pack_eng))
`;

export async function fetchItems(search?: string): Promise<InventoryItem[]> {
  let q = supabase
    .from('inventory_item')
    .select(ITEM_COLUMNS)
    .is('deleted_at', null)
    .order('item_name')
    .limit(200);
  if (search && search.trim()) q = q.ilike('item_name', `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw new Error(`fetchItems: ${error.message}`);
  return (data ?? []) as unknown as InventoryItem[];
}

export type ItemStockRow = {
  item_id: string;
  packaging_id: string | null;
  quantity: number;
};

export async function fetchItemStocks(itemIds: string[]): Promise<ItemStockRow[]> {
  if (itemIds.length === 0) return [];
  const { data, error } = await supabase
    .from('item_stock')
    .select('item_id, packaging_id, quantity')
    .in('item_id', itemIds);
  if (error) throw new Error(`fetchItemStocks: ${error.message}`);
  return (data ?? []) as ItemStockRow[];
}

export async function fetchItem(id: string): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_item')
    .select(ITEM_COLUMNS)
    .eq('id', id)
    .single();
  if (error) throw new Error(`fetchItem: ${error.message}`);
  return data as unknown as InventoryItem;
}
