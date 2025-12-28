import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// import QRCode from "react-qr-code"; 
import { Loader2, Calendar, MapPin, User, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const apiUrl = import.meta.env.VITE_API_URL;

const TicketView = () => {
  const { tokenId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      console.log("Fetching ticket for token:", tokenId);
      try {
        const res = await axios.get(`${apiUrl}/registrations/ticket/${tokenId}`);
        setTicket(res.data);
      } catch (err) {
        console.error("Ticket Fetch Error:", err);
        setError("Ticket not found or server error.");
      } finally {
        setLoading(false);
      }
    };
    if (tokenId) fetchTicket();
  }, [tokenId]);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (error || !ticket) return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 text-destructive gap-4">
      <AlertCircle className="w-12 h-12" />
      <p className="text-lg font-semibold">{error || "Invalid Ticket"}</p>
    </div>
  );

  const getEventDate = () => {
    try {
      if (ticket.eventId?.dateTime) {
        return format(new Date(ticket.eventId.dateTime), "PP p");
      }
      return "Date to be announced";
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* --- HEADER SECTION --- */}
        <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10" />
          
          {/* Flex Container: Left Logo, Right Text */}
          <div className="relative z-10 flex items-center gap-4">
            
            {/* Left Column: Logo */}
            <div className="bg-white p-2.5 rounded-full shadow-lg shrink-0">
              <img 
                src="/favicon.ico" 
                alt="Logo" 
                className="w-8 h-8 object-contain" 
              />
            </div>

            {/* Right Column: Text */}
            <div className="text-center ml-8">
              <h1 className="text-xl font-bold leading-tight">Event Pass</h1>
              <p className="text-xs opacity-90 font-medium tracking-wide">CodeBuilders Community</p>
            </div>
            
          </div>
        </div>
        {/* ---------------------- */}

        {/* QR Section */}
        <div className="flex justify-center py-8 bg-white relative">
           <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-100">
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${ticket.tokenId}`}
               alt="Ticket QR Code"
               className="w-40 h-40 object-contain"
             />
           </div>
        </div>
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6">Scan for Entry</p>

        {/* Ticket Details */}
        <div className="px-6 pb-8 space-y-5">
          <div className="space-y-1 text-center">
            <h3 className="font-bold text-xl text-gray-900 leading-tight">
              {ticket.eventId?.title || "Unknown Event"}
            </h3>
            
            <div className="flex items-center justify-center text-gray-500 text-sm gap-2 pt-1">
              <Calendar className="w-4 h-4" />
              {getEventDate()}
            </div>
            
            <div className="flex items-center justify-center text-gray-500 text-sm gap-2">
              <MapPin className="w-4 h-4" />
              {ticket.eventId?.venue || "Venue TBA"}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-4 relative">
             <div className="absolute -left-8 -top-3 w-6 h-6 bg-gray-100 rounded-full" />
             <div className="absolute -right-8 -top-3 w-6 h-6 bg-gray-100 rounded-full" />
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-gray-900 truncate">{ticket.userName || "Guest"}</p>
              <p className="text-xs text-gray-500 truncate">{ticket.userEmail || "No Email"}</p>
            </div>
          </div>

          <div className="pt-2">
            <Button className="w-full" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-2" /> Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;