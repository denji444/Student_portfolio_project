import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ptutLogo from "@/assets/ptut-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/api";

interface TopNavProps {
  showHome?: boolean;
  showAuth?: boolean;
  showLogout?: boolean;
}

export const TopNav = ({ showHome = true, showAuth = true, showLogout = false }: TopNavProps) => {
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
  };
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMyProfile, enabled: isAuthed });
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <img
                src={ptutLogo}
                alt="PTUT Logo"
                className="h-12 w-12 md:h-16 md:w-16 flex-shrink-0 cursor-pointer"
                onClick={() => window.location.reload()}
              />
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Student Portfolio Dashboard
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 hidden sm:block">
                  Punjab Tianjin University of Technology
                </p>
                <p className="text-xs md:text-sm text-gray-500 hidden md:block">
                  Software Engineering Technology Department
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-2">
              {showHome && (
                <Button asChild variant="outline">
                  <Link to="/">Home</Link>
                </Button>
              )}
              {/* When signed in, show Dashboard button on non-dashboard pages */}
              {isAuthed && (
                <Button asChild variant="outline">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
              {showAuth && !isAuthed && (
                <Button asChild>
                  <Link to="/auth">Sign in / Sign up</Link>
                </Button>
              )}
              {isAuthed && (
                <Link to="/profile" className="inline-flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={me?.profileImageUrl || ''} alt={me?.fullName || 'Profile'} />
                    <AvatarFallback>{(me?.fullName?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
              )}
              {showLogout && isAuthed && (
                <Button variant="destructive" onClick={handleLogout}>Log out</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


