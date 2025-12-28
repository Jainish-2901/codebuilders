import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Loader2 } from 'lucide-react';

export function AdminLayout({ children }) {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> Go to Login
        navigate('/auth', { replace: true });
      } else if (!isAdmin) {
        // Logged in but NOT Admin -> Go to Home
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double check to prevent flash of content
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      {/* Main Wrapper */}
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-background transition-colors duration-300">
        
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 prevents flex items from overflowing */}
          {/* Header */}
          <header className="h-14 bg-white dark:bg-background border-b border-gray-200 dark:border-border flex items-center px-4 gap-4 sticky top-0 z-10 transition-colors duration-300">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-foreground">
              Admin Dashboard
            </h1>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}