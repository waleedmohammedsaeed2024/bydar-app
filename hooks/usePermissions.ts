import { useAuthStore } from '@/stores/auth';
import {
  type AppRole,
  type Permission,
  can,
  resolveRole,
} from '@/lib/permissions';

export function usePermissions(): {
  role: AppRole;
  can: (perm: Permission) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCustomer: boolean;
  isSalesman: boolean;
  isPurchase: boolean;
} {
  const rawRole = useAuthStore((s) => s.user?.app_metadata?.role);
  const role = resolveRole(rawRole);
  return {
    role,
    can: (perm: Permission) => can(role, perm),
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isCustomer: role === 'customer',
    isSalesman: role === 'salesman',
    isPurchase: role === 'purchase',
  };
}
