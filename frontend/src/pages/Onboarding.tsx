import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyProfile, updateMyProfile, startGoogleOAuth } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

export default function Onboarding() {
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rollErr, setRollErr] = useState<string>('');
  const [phoneErr, setPhoneErr] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation() as any;
  const fromPath = location?.state?.from || '/dashboard';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        if (!profile) {
          // Let user fill in details
          setLoading(false);
          return;
        }
        setRollNumber(profile.rollNumber || '');
        setPhone(profile.phone || '');
      } catch (e: any) {
        // If unauthorized, send to auth
        if (e?.message === 'UNAUTHORIZED') {
          navigate('/auth', { replace: true });
          return;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // JS validation
    const rn = rollNumber.toUpperCase().replace(/\s+/g, '');
    const ph = phone.replace(/[^0-9]/g, '');
    const rnOk = /^SET-\d{2}-\d{3}$/.test(rn);
    const phOk = /^03\d{9}$/.test(ph);
    setRollErr(rnOk ? '' : 'Format must be SET-23-001');
    setPhoneErr(phOk ? '' : 'Format must be 03XXXXXXXXX');
    if (!rnOk || !phOk) return;

    setSaving(true);
    try {
      await updateMyProfile({ rollNumber: rn, phone: ph });
      navigate(fromPath, { replace: true });
    } catch (e) {
      alert('Failed to save. Please check inputs and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="min-h-screen bg-fixed bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <SEO title="Onboarding — PTUT Student Portfolio" description="Complete your profile to continue." robots="noindex,nofollow" />
        <h1 className="text-2xl font-semibold">Complete your profile</h1>
        
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Roll Number (Format: SET-23-001)</label>
            <Input
              placeholder="SET-23-001"
              value={rollNumber}
              onChange={(e) => { setRollNumber(e.target.value); if (rollErr) setRollErr(''); }}
            />
            {rollErr ? <p className="text-sm text-red-600">{rollErr}</p> : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Phone (Format: 03XXXXXXXXX)</label>
            <Input
              placeholder="03XXXXXXXXX"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (phoneErr) setPhoneErr(''); }}
            />
            {phoneErr ? <p className="text-sm text-red-600">{phoneErr}</p> : null}
          </div>
          <Button type="submit" disabled={saving} className="w-full">Save and continue</Button>
        </form>
      </main>
    </div>
  );
}
