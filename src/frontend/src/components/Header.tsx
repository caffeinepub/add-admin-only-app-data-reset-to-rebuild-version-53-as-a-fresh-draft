import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Users, Home, FileText, BarChart3, LogOut, LogIn, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

type Page = 'dashboard' | 'agents' | 'properties' | 'inquiries' | 'reports';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: BarChart3, requiresAdmin: false },
    { id: 'agents' as Page, label: 'Agents', icon: Users, requiresAdmin: true },
    { id: 'properties' as Page, label: 'Properties', icon: Home, requiresAdmin: false },
    { id: 'inquiries' as Page, label: 'Inquiries', icon: FileText, requiresAdmin: false },
    { id: 'reports' as Page, label: 'Reports', icon: BarChart3, requiresAdmin: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.requiresAdmin || isAdmin);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/MAA 20251103_174253.jpg" 
              alt="MAA Logo" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="text-xl font-bold">MAA</span>
          </div>
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onNavigate(item.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && userProfile && (
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{userProfile.name}</span>
            </div>
          )}
          <Button onClick={handleAuth} disabled={disabled} variant={isAuthenticated ? 'outline' : 'default'}>
            {disabled ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isAuthenticated ? (
              <LogOut className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {disabled ? 'Loading...' : isAuthenticated ? 'Logout' : 'Login'}
          </Button>
        </div>
      </div>
      {isAuthenticated && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto flex items-center gap-1 overflow-x-auto px-4 py-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
