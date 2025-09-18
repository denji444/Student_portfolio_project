import NeoNav from '@/components/design3/NeoNav';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Login failed');
      localStorage.setItem('adminAccessToken', json.accessToken);
      toast({ title: 'Welcome, Admin' });
      navigate('/admin');
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#fff_40%,#ffe4b5_100%)] px-4">
      <main className="max-w-4xl mx-auto py-6 space-y-6">
        <NeoNav />
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-3 border rounded-lg p-6 bg-card">
        <h1 className="text-xl font-semibold">Admin Sign In</h1>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <div className="relative">
            <Input type={show ? 'text' : 'password'} value={password} onChange={(e)=>setPassword(e.target.value)} required className="pr-10" />
            <button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={()=>setShow(v=>!v)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign In'}</Button>
      </form>
      </main>
    </div>
  );
};

export default AdminLogin;


