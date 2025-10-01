import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyProfile } from '@/lib/api';

/**
 * Protected route wrapper
 * - Redirects unauthenticated users to /auth
 * - If profile is incomplete (missing rollNumber or phone), redirects to /onboarding
 * - If allowIncomplete is true, only enforces authentication
 */
export default function Protected({ children, allowIncomplete = false }: { children: JSX.Element; allowIncomplete?: boolean }) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        if (!profile) {
          // No profile row found yet (should be rare now, but handle anyway)
          if (allowIncomplete) {
            setOk(true);
          } else {
            navigate('/onboarding', { replace: true, state: { from: location.pathname } });
          }
          return;
        }
        const incomplete = !profile.rollNumber || !profile.phone;
        if (incomplete && !allowIncomplete) {
          navigate('/onboarding', { replace: true, state: { from: location.pathname } });
          return;
        }
        setOk(true);
      } catch (e: any) {
        if (e?.message === 'UNAUTHORIZED') {
          navigate('/auth', { replace: true });
        } else {
          // Any other error: fail closed to auth
          navigate('/auth', { replace: true });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [allowIncomplete, navigate, location.pathname]);

  if (checking) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!ok) return null;
  return children;
}
