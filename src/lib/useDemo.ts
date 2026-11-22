import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { DEMO, DEMO_ADMIN, useSession, type Role } from './session';

/** Signs straight into the sample network, as WHO or as its admin. */
export function useStartDemo(role: Role = 'member') {
  const { signIn } = useSession();
  const navigate = useNavigate();
  return useCallback(() => {
    if (role === 'admin') {
      signIn({ role: 'admin', ...DEMO_ADMIN, demo: true });
      navigate('/app/admin');
    } else {
      signIn({ role: 'member', ...DEMO, demo: true });
      navigate('/app/network');
    }
  }, [role, signIn, navigate]);
}
