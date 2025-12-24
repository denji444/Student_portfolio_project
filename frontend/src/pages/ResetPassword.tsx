import NeoNav from '@/components/design3/NeoNav';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { requestPasswordReset, resetPassword } from '@/lib/api';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  // request state
  const [email, setEmail] = useState('');
  const [requesting, setRequesting] = useState(false);

  // reset state
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (!email) {
      toast({ title: 'Email required', variant: 'destructive' });
      return;
    }
    try {
      setRequesting(true);
      await requestPasswordReset({ email });
      toast({ title: 'Reset password email sent' });
    } catch (e: any) {
      toast({ title: 'Could not send reset email', description: e.message, variant: 'destructive' });
    } finally {
      setRequesting(false);
    }
  };

  const handleReset = async () => {
    if (!pwd || !pwd2) {
      toast({ title: 'Both fields are required', variant: 'destructive' });
      return;
    }
    if (pwd !== pwd2) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (pwd.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      await resetPassword({ token, newPassword: pwd });
      toast({ title: 'Password updated' });
      navigate('/auth');
    } catch (e: any) {
      toast({ title: 'Could not reset password', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-fixed bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#e0f2fe_100%)]">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        <NeoNav />
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <h1 className="text-2xl font-semibold">{token ? 'Set a new password' : 'Forgot your password?'}</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              {token ? (
                <>
                  <p className="text-muted-foreground">Enter your new password below.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">New password</label>
                      <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Confirm new password</label>
                      <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
                    </div>
                    <Button onClick={handleReset} disabled={submitting}>{submitting ? 'Updating…' : 'Update password'}</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">Enter your email to receive a password reset link.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <Button onClick={handleRequest} disabled={requesting}>{requesting ? 'Sending…' : 'Send reset link'}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
