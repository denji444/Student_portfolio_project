import { useState } from 'react';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { signup, signin } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import NeoNav from '@/components/design3/NeoNav';
import { supabase } from '@/lib/supabaseClient';

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  rollNumber: z.string().regex(/^SET-\d{2}-\d{3}$/,'Format: SET-23-001'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^03\d{9}$/,'Format: 03XXXXXXXXX'),
  password: z.string().min(8,'Min 8 chars'),
  confirmPassword: z.string().min(8,'Min 8 chars'),
}).refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

const signinSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8,'Min 8 chars'),
});

const Field = ({label, required=false, children}:{label:string;required?:boolean;children:any}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-foreground">
      {label} {required && <span style={{ color: '#ed1f11' }}>*</span>}
    </label>
    {children}
  </div>
);

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin'|'signup'>('signup');
  const [signupForm, setSignupForm] = useState({ fullName:'', rollNumber:'', email:'', phone:'', password:'', confirmPassword:'' });
  const [signinForm, setSigninForm] = useState({ email:'', password:'' });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      toast({ title: 'Account created', description: 'Please verify your email, then sign in.' });
      setMode('signin');
    },
    onError: (e: any) => toast({ title: 'Signup failed', description: e.message, variant: 'destructive' }),
  });

  const signinMutation = useMutation({
    mutationFn: signin,
    onSuccess: (res) => {
      // Initialize Supabase client session so Storage RLS allows uploads
      if (res.accessToken && res.refreshToken) {
        void supabase.auth.setSession({ access_token: res.accessToken, refresh_token: res.refreshToken });
      }
      localStorage.setItem('accessToken', res.accessToken);
      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
      toast({ title: 'Signed in' });
      navigate('/dashboard');
    },
    onError: (e: any) => toast({ title: 'Signin failed', description: e.message, variant: 'destructive' }),
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(signupForm);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      toast({ title: 'Validation error', description: msg, variant: 'destructive' });
      return;
    }
    signupMutation.mutate(parsed.data);
  };

  const handleSignin = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signinSchema.safeParse(signinForm);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
      toast({ title: 'Validation error', description: msg, variant: 'destructive' });
      return;
    }
    signinMutation.mutate(parsed.data);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)]">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <NeoNav />
        <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex gap-2">
              <Button variant={mode==='signup'?'default':'outline'} onClick={()=>setMode('signup')}>Sign up</Button>
              <Button variant={mode==='signin'?'default':'outline'} onClick={()=>setMode('signin')}>Sign in</Button>
            </div>
          </CardHeader>
          <CardContent>
            {mode==='signup' ? (
              <form className="space-y-3" onSubmit={handleSignup}>
                <Field label="Full name" required>
                  <Input value={signupForm.fullName} onChange={e=>setSignupForm({...signupForm, fullName:e.target.value})} />
                </Field>
                <Field label="Roll no." required>
                  <Input placeholder="SET-23-001" value={signupForm.rollNumber} onChange={e=>setSignupForm({...signupForm, rollNumber:e.target.value})} />
                </Field>
                <Field label="Email" required>
                  <Input type="email" value={signupForm.email} onChange={e=>setSignupForm({...signupForm, email:e.target.value})} />
                </Field>
                <Field label="Phone no" required>
                  <Input placeholder="03XXXXXXXXX" value={signupForm.phone} onChange={e=>setSignupForm({...signupForm, phone:e.target.value})} />
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <Input type={showSignupPassword ? 'text' : 'password'} value={signupForm.password} onChange={e=>setSignupForm({...signupForm, password:e.target.value})} className="pr-10" />
                    <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShowSignupPassword(v=>!v)} aria-label={showSignupPassword ? 'Hide password' : 'Show password'}>
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm password" required>
                  <div className="relative">
                    <Input type={showSignupConfirm ? 'text' : 'password'} value={signupForm.confirmPassword} onChange={e=>setSignupForm({...signupForm, confirmPassword:e.target.value})} className="pr-10" />
                    <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShowSignupConfirm(v=>!v)} aria-label={showSignupConfirm ? 'Hide password' : 'Show password'}>
                      {showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Button type="submit" className="w-full" disabled={signupMutation.isLoading}>Create account</Button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleSignin}>
                <Field label="Email" required>
                  <Input type="email" value={signinForm.email} onChange={e=>setSigninForm({...signinForm, email:e.target.value})} />
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <Input type={showSigninPassword ? 'text' : 'password'} value={signinForm.password} onChange={e=>setSigninForm({...signinForm, password:e.target.value})} className="pr-10" />
                    <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShowSigninPassword(v=>!v)} aria-label={showSigninPassword ? 'Hide password' : 'Show password'}>
                      {showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Button type="submit" className="w-full" disabled={signinMutation.isLoading}>Sign in</Button>
              </form>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;


