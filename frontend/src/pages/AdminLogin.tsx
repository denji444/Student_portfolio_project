import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 border rounded-lg p-6 bg-card">
        <h1 className="text-xl font-semibold">Admin Sign In</h1>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign In'}</Button>
      </form>
    </div>
  );
};

export default AdminLogin;


