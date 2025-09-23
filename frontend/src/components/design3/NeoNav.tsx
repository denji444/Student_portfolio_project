import { Link, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, UserRound, LogIn, LogOut } from 'lucide-react';
import ptutLogo from '@/assets/ptut-logo.png';
import { useState, useEffect } from 'react';

type Props = { showBrand?: boolean };

export default function NeoNav({ showBrand = true }: Props) {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we have cookies by trying to fetch a protected endpoint
    fetch('/api/profile/me', { credentials: 'include' })
      .then(res => {
        setIsAuthed(res.ok);
        setIsChecking(false);
      })
      .catch(() => {
        setIsAuthed(false);
        setIsChecking(false);
      });
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (e) {
      // Ignore logout errors - cookies might already be cleared
    }
    setIsAuthed(false);
    navigate('/');
  };

  return (
    <nav className="bg-white border border-[hsl(var(--border))] rounded-[18px] shadow-[6px_6px_14px_rgba(15,23,42,0.06),_-6px_-6px_14px_rgba(255,255,255,0.8)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {showBrand && (
          <div className="flex items-center gap-3 min-w-0">
            <img src={ptutLogo} className="h-10 w-10 rounded-lg border border-[hsl(var(--border))] object-contain" />
            <div className="min-w-0">
              <div className="font-extrabold truncate">Punjab Tianjin University of Technology</div>
              <div className="text-xs text-muted-foreground truncate">Software Engineering Technology Department</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Link to="/" className="h-10 w-10 grid place-items-center bg-white border border-[hsl(var(--border))] rounded-[14px]"><Home size={18} /></Link>
          {!isChecking && isAuthed && (
            <Link to="/dashboard" className="h-10 w-10 grid place-items-center bg-white border border-[hsl(var(--border))] rounded-[14px]"><LayoutDashboard size={18} /></Link>
          )}
          {!isChecking && isAuthed ? (
            <>
              <Link to="/profile" className="h-10 w-10 grid place-items-center bg-white border border-[hsl(var(--border))] rounded-[14px]"><UserRound size={18} /></Link>
              <button onClick={logout} className="h-10 w-10 grid place-items-center bg-white border border-[hsl(var(--border))] rounded-[14px]"><LogOut size={18} /></button>
            </>
          ) : !isChecking ? (
            <Link to="/auth" className="h-10 w-10 grid place-items-center bg-white border border-[hsl(var(--border))] rounded-[14px]"><LogIn size={18} /></Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}


