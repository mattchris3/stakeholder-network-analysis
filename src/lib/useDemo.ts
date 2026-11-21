import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { DEMO, useSession } from './session';

/** Signs straight into the sample network as WHO, then opens the graph. */
export function useStartDemo() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  return useCallback(() => {
    signIn({ role: 'member', ...DEMO, demo: true });
    navigate('/app/network');
  }, [signIn, navigate]);
}
