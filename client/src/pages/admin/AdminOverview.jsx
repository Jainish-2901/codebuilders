import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, UserCheck, TrendingUp, Loader2, UserPlus, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

export default function AdminOverview() {
  const [page, setPage] = useState(1); // ✅ Track current page

  // 1. Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      return await apiClient.getAdminOverview();
    },
  });

  // 2. Fetch Registrations (Paginated: Limit 10)
  const { data: registrationData, isLoading: regLoading } = useQuery({
    queryKey: ['overview-registrations', page], // ✅ Page change triggers refetch
    queryFn: async () => {
        // Fetch page 'page', empty search, limit 10
        return await apiClient.getAllRegistrations(page, '', 10);
    },
    keepPreviousData: true,
  });

  const recentRegistrations = registrationData?.registrations || [];
  const totalPages = registrationData?.pages || 1;

  const statCards = [
    { 
      title: 'Total Events', 
      value: stats?.totalEvents ?? 0, 
      icon: Calendar, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10' 
    },
    { 
      title: 'Total Registrations', 
      value: stats?.totalRegistrations ?? 0, 
      icon: Ticket, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      title: 'Total Users', 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    { 
      title: 'Active Volunteers', 
      value: stats?.totalVolunteers ?? 0, 
      icon: UserCheck, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
  ];

  if (statsLoading || regLoading) {
      return (
          <AdminLayout>
              <div className="flex justify-center items-center h-[80vh]">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
          </AdminLayout>
      )
  }

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">Real-time platform statistics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="glass border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Registrations List (Paginated) */}
        <Card className="glass border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Registrations
            </CardTitle>
            <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </div>
          </CardHeader>
          <CardContent>
            {recentRegistrations && recentRegistrations.length > 0 ? (
              <div className="space-y-4">
                {recentRegistrations.map((reg) => (
                  <div key={reg._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors gap-4">
                    
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{reg.userName}</p>
                            <p className="text-sm text-muted-foreground">{reg.userEmail}</p>
                        </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-1">
                        {reg.eventId?.title || "Unknown Event"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reg.createdAt ? format(new Date(reg.createdAt), 'PPP p') : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                  <p className="text-muted-foreground">No registrations found.</p>
              </div>
            )}

            {/* ✅ PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page Numbers Logic */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            // Only show current, first, last, and neighbors
                            if (
                                totalPages > 8 &&
                                Math.abs(page - pageNum) > 1 &&
                                pageNum !== 1 &&
                                pageNum !== totalPages
                            ) {
                                if (Math.abs(page - pageNum) === 2) return <span key={pageNum} className="px-1">...</span>;
                                return null;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setPage(pageNum)}
                                    className="w-8 h-8 p-0"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}