import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Loader2 } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/AgentsPage';
import PropertiesPage from './pages/PropertiesPage';
import InquiriesPage from './pages/InquiriesPage';
import ReportsPage from './pages/ReportsPage';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';

type Page = 'dashboard' | 'agents' | 'properties' | 'inquiries' | 'reports';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const saveProfile = useSaveCallerUserProfile();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const [profileForm, setProfileForm] = useState({ name: '', contactInfo: '' });

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Redirect to dashboard if trying to access admin-only pages without permission
  useEffect(() => {
    if (isAuthenticated && currentPage === 'agents' && isAdmin === false) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage, isAdmin]);

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.contactInfo.trim()) return;
    await saveProfile.mutateAsync(profileForm);
  };

  if (loginStatus === 'initializing' || (isAuthenticated && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
          <Header currentPage={currentPage} onNavigate={setCurrentPage} />
          <main className="flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
              <img 
                src="/assets/MAA 20251103_174253.jpg" 
                alt="MAA Logo" 
                className="mx-auto mb-8 h-40 w-40 rounded-full object-cover shadow-lg"
              />
              <h1 className="mb-2 text-4xl font-bold tracking-tight">MAA</h1>
              <h2 className="mb-4 text-xl font-semibold text-muted-foreground">
                Mulund Real Estate Agents' Association
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Manage your properties, agents, and inquiries with powerful analytics
              </p>
              <div className="rounded-lg border bg-card p-8 shadow-lg">
                <p className="mb-6 text-muted-foreground">Please login to access the dashboard</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'agents' && <AgentsPage />}
          {currentPage === 'properties' && <PropertiesPage />}
          {currentPage === 'inquiries' && <InquiriesPage />}
          {currentPage === 'reports' && <ReportsPage />}
        </main>
        <Footer />

        <Dialog open={showProfileSetup} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Welcome! Set up your profile</DialogTitle>
              <DialogDescription>Please provide your name and contact information to continue.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Information</Label>
                <Input
                  id="contact"
                  placeholder="Email or phone number"
                  value={profileForm.contactInfo}
                  onChange={(e) => setProfileForm({ ...profileForm, contactInfo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSaveProfile}
                disabled={!profileForm.name.trim() || !profileForm.contactInfo.trim() || saveProfile.isPending}
                className="w-full"
              >
                {saveProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}
