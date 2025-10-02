import NeoNav from '@/components/design3/NeoNav';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { resendVerification } from '@/lib/api';

const VerifyEmail = () => {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const email = params.get('email') ?? '';

  const handleResend = async () => {
    if (!email) {
      toast({ title: 'Email missing', description: 'Open this page from signup to auto-fill your email, or go back to sign in and use Forgot password if needed.', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      await resendVerification({ email });
      toast({ title: 'Verification sent', description: 'Check your inbox and spam folder.' });
    } catch (e: any) {
      toast({ title: 'Could not resend', description: e.message || 'Please try again later', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fixed bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <SEO title="Verify your email — PTUT Student Portfolio" description="We emailed you a verification link to activate your PTUT SET account." robots="noindex,nofollow" />
        <NeoNav />
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <h1 className="text-2xl font-semibold">Verify your email</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We have sent a verification link to <span className="font-medium">{email || 'your email'}</span>. Please open your email and click the link to activate your account.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>It can take 1–2 minutes to arrive. Please wait a bit.</li>
                <li>Check your spam/junk folder as well.</li>
                <li>If you still don't receive it, try resending below or contact the admin.</li>
              </ul>
              <div className="flex gap-2">
                <Button onClick={handleResend} disabled={isLoading}>
                  {isLoading ? 'Resending…' : 'Resend verification email'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')}>Back to sign in</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Having trouble? Contact admin at <a className="underline" href="mailto:noreplytostudent@gmail.com">noreplytostudent@gmail.com</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;



