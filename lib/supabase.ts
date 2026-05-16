import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Prefer EXPO_PUBLIC_* env vars (inlined at bundle time). Fall back to
// app.json's `extra` block read via expo-constants at runtime — this avoids
// the "dev server cached an empty bundle" gotcha when .env is edited late.
const extras = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extras.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extras.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'supabaseUrl',
    !supabaseAnonKey && 'supabaseAnonKey',
  ].filter(Boolean).join(', ');
  throw new Error(
    `Missing ${missing}. Set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ` +
    `in .env, OR set expo.extra.supabaseUrl / expo.extra.supabaseAnonKey in app.json.`,
  );
}

// SecureStore caps each value at 2048 bytes; Supabase sessions stay well under
// that. On web we use the SDK's default (localStorage); on native we use
// SecureStore for the JWT.
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// AsyncStorage adapter kept for non-sensitive caches if needed elsewhere.
export const cacheStorage = AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
