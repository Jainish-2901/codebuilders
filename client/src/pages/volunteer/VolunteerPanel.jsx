import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { VolunteerLayout } from '@/components/volunteer/VolunteerLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Camera, XCircle, Users, CheckCircle2, ScanLine, AlertTriangle, RefreshCcw, MapPin } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function VolunteerPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  
  // Use a ref to track if scanner is currently running to prevent duplicates
  const scannerRef = useRef(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: volunteer, isError, error } = useQuery({
    queryKey: ['volunteer-info'],
    queryFn: () => apiClient.getVolunteerMe(),
    retry: false 
  });

  const { data: registrations = [], isLoading, isRefetching } = useQuery({
    queryKey: ['volunteer-registrations', volunteer?.assignedEventId],
    queryFn: async () => {
      if (!volunteer?.assignedEventId) return [];
      const eventId = typeof volunteer.assignedEventId === 'object' 
        ? volunteer.assignedEventId._id 
        : volunteer.assignedEventId;

      return await apiClient.getAllRegistrations(eventId);
    },
    enabled: !!volunteer?.assignedEventId,
    refetchInterval: 3000, 
  });

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const matchesSearch = !searchTerm || 
        reg.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.tokenId && reg.tokenId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'attended' && reg.isAttended) ||
        (statusFilter === 'pending' && !reg.isAttended);

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchTerm, statusFilter]);

  const checkInMutation = useMutation({
    mutationFn: (tokenId) => apiClient.checkInRegistration(tokenId),
    onSuccess: (data) => {
      setScannedUser(data); 
      setIsScanning(false);
      
      // Force cleanup of scanner on success
      if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.warn(err));
          scannerRef.current = null;
      }

      queryClient.invalidateQueries({ queryKey: ['volunteer-registrations'] });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    },
    onError: (error) => {
      // Don't stop scanning on error, just show toast
      toast({ variant: 'destructive', title: 'Check-in Failed', description: error.message || "Invalid Token" });
    },
  });

  const toggleAttendance = useMutation({
    mutationFn: ({ id, isAttended }) => apiClient.toggleRegistrationAttendance(id, isAttended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-registrations'] });
      toast({ title: 'Attendance updated' });
    },
  });

  // 👇 FIXED SCANNER LOGIC (Kept inside component as requested, but stabilized)
  useEffect(() => {
    let html5QrcodeScanner = null;

    if (isScanning && !scannedUser) {
      // Small delay to ensure <div id="qr-reader"> is mounted
      const timer = setTimeout(() => {
        if (!document.getElementById('qr-reader')) return;

        // If scanner already exists, don't create another one
        if (scannerRef.current) return;

        try {
          html5QrcodeScanner = new Html5QrcodeScanner(
            'qr-reader', 
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              disableFlip: false 
            }, 
            false
          );
          
          scannerRef.current = html5QrcodeScanner;

          html5QrcodeScanner.render(
            (decodedText) => {
              // Prevent multiple calls if already loading
              if (checkInMutation.isPending) return;
              
              const token = decodedText.includes('/') ? decodedText.split('/').pop() : decodedText;
              
              if (token) {
                // Pause scanning visually (optional, but good UX)
                // html5QrcodeScanner.pause(); 
                checkInMutation.mutate(token);
              }
            },
            (error) => {
              // Ignore scan errors to keep logs clean
            }
          );
        } catch (err) { console.error("Scanner Error:", err); }
      }, 100);

      // Cleanup function
      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => console.warn("Cleanup warning", error));
          scannerRef.current = null;
        }
      };
    }
  }, [isScanning, scannedUser]); // Removing checkInMutation from deps to prevent re-render loops

  const handleScanNext = () => {
    setScannedUser(null);
    setIsScanning(true);
  };

  const stats = {
    total: registrations.length,
    attended: registrations.filter((r) => r.isAttended).length,
  };

  if (isError) {
    return (
      <VolunteerLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <Card className="glass border-destructive/50 max-w-md w-full">
            <CardContent className="pt-8 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">Your account is not linked to a Volunteer Profile.</p>
            </CardContent>
          </Card>
        </div>
      </VolunteerLayout>
    );
  }

  if (volunteer && !volunteer.assignedEventId) {
    return (
      <VolunteerLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <Card className="glass border-border max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Event Assigned</h2>
            </CardContent>
          </Card>
        </div>
      </VolunteerLayout>
    );
  }

  if (scannedUser) {
    return (
      <VolunteerLayout>
        <div className="flex items-center justify-center min-h-[80vh] px-4 animate-fade-in">
          <Card className="glass border-emerald-500/50 shadow-2xl max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/10" />
            <CardContent className="pt-12 pb-12 text-center relative z-10">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-scale-in">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-700 mb-2">Verified!</h2>
              <p className="text-muted-foreground mb-8">Check-in Successful</p>
              <div className="bg-background/50 rounded-xl p-6 mb-8 border border-border backdrop-blur-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Attendee</p>
                <p className="text-2xl font-bold text-foreground truncate">{scannedUser.userName}</p>
                <Badge className="mt-4 bg-emerald-500 hover:bg-emerald-600">TOKEN: {scannedUser.tokenId}</Badge>
              </div>
              <Button size="lg" className="w-full h-14 text-lg shadow-lg" onClick={handleScanNext}>
                <ScanLine className="w-5 h-5 mr-2" /> Scan Next
              </Button>
            </CardContent>
          </Card>
        </div>
      </VolunteerLayout>
    );
  }

  return (
    <VolunteerLayout>
      <div className="space-y-4 max-w-5xl mx-auto pb-20">
        
        {/* 1. Header (Old Layout) */}
        <div className="glass border-border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3 border-b border-border/50 pb-2">
                <div>
                    <p className="text-xs text-muted-foreground">Hi, <span className="text-foreground font-semibold">{volunteer?.name || 'Volunteer'}</span></p>
                </div>
                <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border/50">
                      <div className={`w-2 h-2 rounded-full ${isRefetching ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{isRefetching ? "Syncing" : "Live"}</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <h2 className="font-bold text-lg leading-tight truncate">
                        {typeof volunteer?.assignedEventId === 'object' ? volunteer.assignedEventId.title : 'Event'}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-600 leading-none">{stats.attended}</span>
                        <span className="text-[10px] font-bold text-emerald-700/70 uppercase mt-1">Checked In</span>
                    </div>
                    <div className="bg-background/50 border border-border/50 rounded-lg p-3 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground leading-none">{stats.total - stats.attended}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Remaining</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Main Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setIsScanning(!isScanning)}
            size="lg"
            variant={isScanning ? 'destructive' : 'default'}
            className="w-full h-12 shadow-md text-base font-semibold"
          >
            {isScanning ? <><XCircle className="w-5 h-5 mr-2" /> Stop Camera</> : <><Camera className="w-5 h-5 mr-2" /> Scan Ticket</>}
          </Button>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-background/60"
              />
            </div>
            
            <div className="flex bg-secondary/30 rounded-md p-1">
                <Button 
                  variant={statusFilter === 'all' ? 'secondary' : 'ghost'} 
                  size="icon"
                  className="w-9 h-8"
                  onClick={() => setStatusFilter('all')}
                >
                  <Users className="w-4 h-4" />
                </Button>
                <Button 
                  variant={statusFilter === 'attended' ? 'secondary' : 'ghost'} 
                  size="icon"
                  className={`w-9 h-8 ${statusFilter === 'attended' ? "text-emerald-600 bg-emerald-100" : ""}`}
                  onClick={() => setStatusFilter('attended')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'secondary' : 'ghost'} 
                  size="icon"
                  className="w-9 h-8"
                  onClick={() => setStatusFilter('pending')}
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>

        {/* 3. Scanner Area - Kept Exact same place */}
        {isScanning && (
          <Card className="glass border-primary border-2 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
             <div className="bg-black/5 p-3 text-center border-b border-border">
               <p className="text-xs font-medium animate-pulse text-primary">Point camera at QR Code</p>
             </div>
             <CardContent className="p-0 bg-black">
               <div id="qr-reader" className="w-full mx-auto" />
             </CardContent>
          </Card>
        )}

        {/* 4. List */}
        <Card className="glass border-border overflow-hidden">
          <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((reg) => (
                      <TableRow key={reg._id} className={reg.isAttended ? "bg-emerald-500/5" : ""}>
                        <TableCell>
                          <div className="font-medium">{reg.userName}</div>
                          <div className="text-xs text-muted-foreground">{reg.userEmail}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{reg.tokenId}</TableCell>
                        <TableCell>
                          <Badge variant={reg.isAttended ? 'default' : 'outline'} className={reg.isAttended ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                            {reg.isAttended ? 'Checked In' : 'Waiting'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAttendance.mutate({ id: reg._id, isAttended: !reg.isAttended })}
                          >
                            {reg.isAttended ? "Undo" : "Check In"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden divide-y divide-border">
                {filteredRegistrations.map((reg) => (
                  <div key={reg._id} className={`p-4 flex items-center justify-between ${reg.isAttended ? "bg-emerald-500/5" : ""}`}>
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-sm truncate text-foreground">{reg.userName}</p>
                        {reg.isAttended && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground">#{reg.tokenId}</p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={reg.isAttended ? "outline" : "default"}
                      className={`h-8 px-4 text-xs font-medium shadow-sm ${reg.isAttended ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "bg-emerald-600 hover:bg-emerald-700"}`}
                      onClick={() => toggleAttendance.mutate({ id: reg._id, isAttended: !reg.isAttended })}
                    >
                      {reg.isAttended ? "Undo" : "Check In"}
                    </Button>
                  </div>
                ))}
                {filteredRegistrations.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No attendees found.
                  </div>
                )}
              </div>
          </CardContent>
        </Card>
      </div>
    </VolunteerLayout>
  );
}