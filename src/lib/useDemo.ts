import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSession, type Role } from './session';

/** Signs straight into the sample network (anonymously), as WHO or as its admin. */
export function useStartDemo(role: Role = 'member') {
  const { startDemo } = useSession();
  const navigate = useNavigate();
  return useCallback(async () => {
    await startDemo(role);
    navigate(role === 'admin' ? '/app/admin' : '/app/network');
  }, [role, startDemo, navigate]);
}
