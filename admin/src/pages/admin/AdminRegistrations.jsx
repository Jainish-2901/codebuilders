import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// ✅ Added AlertDialog Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Trash2, 
  Loader2, 
  Ticket, 
  ExternalLink,
  RefreshCcw,
  Download 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminRegistrations() {
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Fetch Events
  const { data: events } = useQuery({
    queryKey: ['events-list'],
    queryFn: () => apiClient.getEvents(),
  });

  // 2. Fetch ALL Registrations (limit='all')
  const { data: apiResponse, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-registrations', selectedEvent],
    queryFn: () => {
        const eventIdParam = selectedEvent === 'all' ? null : selectedEvent;
        return apiClient.getAllRegistrations(1, '', 'all', eventIdParam);
    },
    refetchInterval: 5000, 
  });

  const registrations = apiResponse?.registrations || [];

  // 3. Search Filter (Client-side)
  const filteredRegistrations = registrations.filter(reg => 
    !searchTerm || 
    reg.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.tokenId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutation: Delete Registration
  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      // ✅ Updated Toast
      toast({ title: 'Registration deleted successfully', description: 'The registration record has been removed.' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  // Export to CSV Function
  const downloadCSV = () => {
    if (!filteredRegistrations || filteredRegistrations.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = ["Name", "Email", "Event Title", "Registration Date", "Token ID", "Status"];

    const csvRows = [
      headers.join(","),
      ...filteredRegistrations.map(reg => {
        const safe = (text) => `"${String(text || "").replace(/"/g, '""')}"`;
        return [
          safe(reg.userName),
          safe(reg.userEmail),
          safe(reg.eventId?.title),
          safe(reg.createdAt ? format(new Date(reg.createdAt), 'yyyy-MM-dd HH:mm') : ''),
          safe(reg.tokenId),
          safe(reg.isAttended ? "Checked In" : "Registered")
        ].join(",");
      })
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registrations_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successfully downloaded" });
  };

  // Stats
  const stats = {
    total: filteredRegistrations.length,
    attended: filteredRegistrations.filter((r) => r.isAttended).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Registrations</h2>
            <p className="text-muted-foreground">Monitor live check-ins and registrations</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadCSV} 
              disabled={isLoading || stats.total === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              {isRefetching ? "Updating..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="glass border-border bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Live Check-Ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{stats.attended}</div>
            </CardContent>
          </Card>
          <Card className="glass border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Filter by event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events?.map((event) => (
                <SelectItem key={event._id} value={event._id}>{event.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="glass border-border">
          <CardContent className="p-0">
            {isLoading && !apiResponse ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((reg) => (
                    <TableRow key={reg._id} className={reg.isAttended ? "bg-emerald-500/5 transition-colors duration-500" : ""}>
                      <TableCell>
                        <div className="font-medium">{reg.userName}</div>
                        <div className="text-xs text-muted-foreground">{reg.userEmail}</div>
                        {reg.tokenId && <div className="text-[10px] text-primary font-mono mt-0.5">#{reg.tokenId}</div>}
                      </TableCell>
                      
                      <TableCell className="max-w-[200px] truncate" title={reg.eventId?.title}>
                        {reg.eventId?.title || 'Unknown Event'}
                      </TableCell>
                      
                      <TableCell className="whitespace-nowrap">
                        {reg.createdAt ? format(new Date(reg.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>

                      <TableCell>
                        {reg.tokenId ? (
                          <a href={`/ticket/${reg.tokenId}`} target="_blank" rel="noopener noreferrer">
                             <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/80">
                               <Ticket className="w-4 h-4" />
                               <span className="text-xs">View</span>
                               <ExternalLink className="w-3 h-3 ml-0.5" />
                             </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={reg.isAttended ? 'default' : 'outline'} className={reg.isAttended ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {reg.isAttended ? 'Checked In' : 'Registered'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          
                          {/* ✅ Delete Confirmation Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the registration for <strong>{reg.userName}</strong>?
                                  <br />
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(reg._id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRegistrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? "No results found matching your search." : "No registrations found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}