import type { PostgrestError } from '@supabase/supabase-js';

export function assertNoError<T>(
  result: { data: T | null; error: PostgrestError | null },
  context: string,
): asserts result is { data: T; error: null } {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`${context}: no data returned`);
  }
}
