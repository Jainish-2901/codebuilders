import { useState, useEffect, useRef, useMemo } from 'react';
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
import { Html5Qrcode } from 'html5-qrcode';

export default function VolunteerPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  
  const scannerInstanceRef = useRef(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Volunteer Info Fetching
  const { data: volunteer, isError } = useQuery({
    queryKey: ['volunteer-info'],
    queryFn: () => apiClient.getVolunteerMe(),
    retry: false 
  });

  // 2. Registrations Fetching (Live Sync)
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
    refetchInterval: 5000, 
  });

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        reg.userName.toLowerCase().includes(term) ||
        reg.userEmail.toLowerCase().includes(term) ||
        (reg.tokenId && reg.tokenId.toLowerCase().includes(term));

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'attended' && reg.isAttended) ||
        (statusFilter === 'pending' && !reg.isAttended);

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchTerm, statusFilter]);

  // 3. Scanner Control Functions
  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
        scannerInstanceRef.current = null;
      } catch (err) {
        console.warn("Stop error", err);
      }
    }
    setIsScanning(false);
  };

  const startScanner = () => {
    setIsScanning(true);
    setScannedUser(null);
  };

  // 4. Mutations
  const checkInMutation = useMutation({
    mutationFn: (tokenId) => apiClient.checkInRegistration(tokenId),
    onSuccess: (data) => {
      setScannedUser(data); 
      stopScanner();
      queryClient.invalidateQueries({ queryKey: ['volunteer-registrations'] });
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
      toast({ title: "Verified!", description: `${data.userName} is now checked in.` });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Invalid Ticket', description: error.message || "QR Code not recognized" });
    },
  });

  // 5. Full-Screen Scanner Logic
  useEffect(() => {
    if (isScanning && !scannedUser) {
      const scanner = new Html5Qrcode("qr-reader");
      scannerInstanceRef.current = scanner;

      const config = { 
        fps: 20, 
        qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: window.innerHeight / window.innerWidth
      };

      scanner.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          const token = decodedText.includes('/') ? decodedText.split('/').pop() : decodedText;
          if (token && !checkInMutation.isPending) {
            checkInMutation.mutate(token);
          }
        },
        () => {} 
      ).catch(err => {
        console.error("Scanner Start Error", err);
        setIsScanning(false);
        toast({ variant: "destructive", title: "Camera Error", description: "Please allow camera permissions." });
      });

      return () => {
        if (scannerInstanceRef.current) {
          scanner.stop().catch(() => {});
        }
      };
    }
  }, [isScanning, scannedUser]);

  const stats = {
    total: registrations.length,
    attended: registrations.filter((r) => r.isAttended).length,
  };

  if (isError) return <VolunteerLayout><div className="p-10 text-center">Access Denied</div></VolunteerLayout>;

  return (
    <VolunteerLayout>
      {/* Custom Styles for Fullscreen & UI Fixes */}
      <style dangerouslySetInnerHTML={{ __html: `
        .fullscreen-scanner {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
          background: black !important;
        }
        #qr-reader { width: 100% !important; height: 100% !important; border: none !important; }
        #qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        
        /* Blue text to White fix */
        #qr-reader__status_span, #qr-reader__header_message, div[id^="qr-reader__dashboard_section"] {
          color: white !important;
        }
        #qr-reader__camera_selection, #qr-reader__dashboard_section_csr button {
          background: #333 !important; color: white !important; border-radius: 8px; border: 1px solid #555;
          padding: 5px 10px; margin: 5px;
        }

        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan 2s linear infinite;
        }
      `}} />

      <div className="space-y-4 max-w-5xl mx-auto pb-24 px-2 pt-4">
        
        {/* Statistics Header */}
        <div className="glass border-border rounded-2xl p-5 shadow-sm bg-card/50 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Volunteer Console</h1>
                    <p className="text-xs text-muted-foreground">Duty: {volunteer?.name}</p>
                </div>
                <Badge className={isRefetching ? "animate-pulse bg-amber-500" : "bg-emerald-500"}>
                  {isRefetching ? "Syncing..." : "Live"}
                </Badge>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary bg-primary/5 p-2 rounded-lg border border-primary/10">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <h2 className="font-semibold text-xs truncate">
                        {typeof volunteer?.assignedEventId === 'object' ? volunteer.assignedEventId.title : 'No Event Assigned'}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-emerald-600 leading-none">{stats.attended}</p>
                        <p className="text-[10px] font-bold text-emerald-700/70 uppercase mt-1">Attended</p>
                    </div>
                    <div className="bg-secondary/50 border border-border/50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-foreground leading-none">{stats.total - stats.attended}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Pending</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Fullscreen Scanner Modal */}
        {isScanning && (
          <div className="fullscreen-scanner flex flex-col items-center justify-center">
            {/* Top Bar with Close Button */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-[10002] bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-white font-bold tracking-widest text-sm uppercase">QR Scanner</p>
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full w-12 h-12 shadow-2xl"
                onClick={stopScanner}
              >
                <XCircle className="w-8 h-8" />
              </Button>
            </div>

            {/* Visual Frame Overlay */}
            <div className="relative w-[280px] h-[280px] border-2 border-white/30 rounded-[40px] z-[10001] pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan-line"></div>
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
            </div>

            <div className="absolute bottom-16 text-center z-[10001] px-10">
                <p className="text-white/80 text-xs font-medium px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
                   Align attendee QR code inside the frame
                </p>
            </div>

            <div id="qr-reader" />
          </div>
        )}

        {/* Search & Action Bar */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={startScanner}
            size="lg"
            className="w-full h-14 shadow-lg text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 transition-transform active:scale-95"
          >
            <Camera className="w-6 h-6 mr-2" /> Start Scanning
          </Button>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search attendee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl bg-background border-none shadow-sm"
              />
            </div>
            
            <div className="flex bg-secondary/30 rounded-xl p-1">
                {['all', 'attended', 'pending'].map((f) => (
                  <Button 
                    key={f}
                    variant={statusFilter === f ? 'secondary' : 'ghost'} 
                    size="icon"
                    className={`w-10 h-9 rounded-lg ${statusFilter === f && f === 'attended' ? "text-emerald-600 bg-white shadow-sm" : ""}`}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === 'all' && <Users className="w-5 h-5" />}
                    {f === 'attended' && <CheckCircle2 className="w-5 h-5" />}
                    {f === 'pending' && <RefreshCcw className="w-5 h-5" />}
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Scanned Success Preview */}
        {scannedUser && !isScanning && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-emerald-500/50 bg-emerald-500/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="text-white w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{scannedUser.userName}</p>
                  <p className="text-[10px] font-mono text-emerald-600 uppercase font-bold tracking-widest">Success Check-in</p>
                </div>
                <Button onClick={() => setScannedUser(null)} variant="ghost" size="sm" className="text-xs">Dismiss</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* List Section */}
        <Card className="border-border rounded-2xl overflow-hidden bg-card/30">
          <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredRegistrations.map((reg) => (
                  <div key={reg._id} className={`p-4 flex items-center justify-between ${reg.isAttended ? "bg-emerald-500/5 opacity-80" : "bg-background/20"}`}>
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-bold text-sm text-foreground truncate">{reg.userName}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate tracking-tight">{reg.userEmail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[9px] h-4 font-mono px-1 border-muted-foreground/30">#{reg.tokenId}</Badge>
                        {reg.isAttended && <Badge className="bg-emerald-100 text-emerald-700 text-[9px] h-4 border-none uppercase font-bold">Verified</Badge>}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={reg.isAttended ? "outline" : "default"}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${reg.isAttended ? "border-amber-200 text-amber-600 bg-amber-50/50" : "bg-primary text-primary-foreground shadow-md"}`}
                      onClick={() => {
                        apiClient.toggleRegistrationAttendance(reg._id, !reg.isAttended).then(() => {
                           queryClient.invalidateQueries({ queryKey: ['volunteer-registrations'] });
                           toast({ title: reg.isAttended ? "Check-in Undone" : "Manual Check-in Success" });
                        });
                      }}
                    >
                      {reg.isAttended ? "Undo" : "Verify"}
                    </Button>
                  </div>
                ))}
                {filteredRegistrations.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center gap-2">
                    <Search className="w-10 h-10 text-muted-foreground opacity-10" />
                    <p className="text-muted-foreground text-sm font-medium">No attendees found</p>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>
      </div>
    </VolunteerLayout>
  );
}