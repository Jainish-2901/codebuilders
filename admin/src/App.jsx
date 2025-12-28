import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom"; 
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminExternalEvents from "./pages/admin/AdminExternalEvents";
import AdminSpeakers from "./pages/admin/AdminSpeakers";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminVolunteers from "./pages/admin/AdminVolunteers";
import AdminUsers from './pages/admin/AdminUsers';

import AdminMessages from "./pages/admin/AdminMessages";
import TicketView from "./pages/TicketView";
import Profile from './pages/common/Profile'; 
import ForgotPassword from './pages/ForgotPassword';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Auth />} />
            
            {/* SHARED PROFILE ROUTE */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/external-events" element={<AdminExternalEvents />} />
            <Route path="/admin/speakers" element={<AdminSpeakers />} />
            <Route path="/admin/registrations" element={<AdminRegistrations />} />
            <Route path="/admin/volunteers" element={<AdminVolunteers />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            
            {/* Ticket View */}
            <Route path="/ticket/:tokenId" element={<TicketView />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;