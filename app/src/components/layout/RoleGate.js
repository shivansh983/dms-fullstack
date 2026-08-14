import { useAuthStore } from '../../store/authStore';

export default function RoleGate({ allow = [], children, fallback = null }) {
  const role = useAuthStore((s) => s.user?.role);
  return allow.includes(role) ? children : fallback;
}