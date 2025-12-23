import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async"; 
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowLeft, Loader2, Share2, ShieldCheck, AlertCircle, Copy, Image as ImageIcon, X, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, isPast, addHours } from "date-fns"; 

// 👇 1. FIX: Import the missing component
import AddToCalendar from "@/components/events/AddToCalendar";

const apiUrl = import.meta.env.VITE_API_URL;

const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  
  // State for Lightbox
  const [selectedImage, setSelectedImage] = useState(null);

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80";

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${apiUrl}/events/${id}`);
        setEvent(res.data);
      } catch (error) {
        console.error("Event not found", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/registrations`, {
        eventId: event._id,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
      });
      toast({ title: "Registration Successful!", description: "Check your email for the ticket." });
      setIsRegistering(false);
      setFormData({ name: "", email: "", phone: "" });
    } catch (err) {
      toast({ 
        title: "Registration Failed", 
        description: err.response?.data?.message || "Something went wrong.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith("http") || imagePath.startsWith("https")) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, "/");
    const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${normalizedPath}`;
  };

  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  const displayImage = event ? getImageUrl(event.imageUrl || event.image_url) : PLACEHOLDER_IMAGE;

  const handleShare = async () => {
    if (!event) return;
    const shareData = {
      title: event.title,
      text: `${event.title}\n\n${event.description}\n\nJoin us here:`, 
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log("Share canceled"); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Event link copied to clipboard." });
    }
  };

  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = imageUrl.split('/').pop() || 'memory-image.jpg';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: "Image saved to your device." });
    } catch (error) {
      console.error("Download failed:", error);
      toast({ variant: "destructive", title: "Download Failed", description: "Could not save image." });
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("embed") || url.includes("output=embed")) return url;
    return `https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!event) return <div>Event Not Found</div>;

  const rawDate = event.dateTime || event.date;
  const eventDateObj = rawDate ? new Date(rawDate) : null;
  const isDateValid = eventDateObj && isValid(eventDateObj);
  const isEventOver = isDateValid && isPast(eventDateObj);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Helmet>
        <title>{event.title} | CodeBuilders</title>
        <meta name="description" content={event.description} />
      </Helmet>

      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to="/events" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
          </Link>
    
          <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
            <div className="lg:col-span-8 space-y-10">
              {/* Hero Image */}
              <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                <img src={displayImage} alt={event.title} onError={handleImageError} className="w-full h-full object-contain" />
              </div>

              {/* Title & Host */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight break-words">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Hosted By</p><span className="font-medium text-foreground">CodeBuilders Team</span></div>
                  </div>
                  
                  {/* 👇 2. FIX: Safely pass formatted props to AddToCalendar */}
                  {isDateValid && (
                    <AddToCalendar event={{
                       title: event.title,
                       description: event.description,
                       venue: event.venue,
                       date: format(eventDateObj, 'yyyy-MM-dd'),
                       startTime: format(eventDateObj, 'HH:mm'),
                       endTime: format(addHours(eventDateObj, 2), 'HH:mm') // Estimate 2 hours
                    }} />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-lg prose-invert max-w-none">
                <h3 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-4">About Event</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{event.fullDescription || event.description}</p>
              </div>

              {/* Map Section */}
              {event.mapUrl && (
                <div className="space-y-4">
                   <h3 className="text-2xl font-semibold border-l-4 border-primary pl-4">Location</h3>
                   <div className="w-full h-[350px] rounded-xl overflow-hidden border border-border shadow-sm bg-muted relative">
                     <iframe 
                       src={event.mapUrl.includes("embed") ? event.mapUrl : getEmbedUrl(event.mapUrl)} 
                       width="100%" 
                       height="100%" 
                       style={{ border: 0 }} 
                       allowFullScreen="" 
                       loading="lazy" 
                       referrerPolicy="no-referrer-when-downgrade"
                       title="Event Location"
                     ></iframe>
                   </div>

                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-secondary/30 dark:bg-secondary/10 p-4 rounded-xl border border-border/50 backdrop-blur-sm transition-colors duration-300">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {/* Dynamic Icon Container: Removed bg-white, added card background */}
                      <div className="w-12 h-12 rounded-2xl bg-background dark:bg-card flex items-center justify-center border border-border shadow-sm shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div>
                        <span className="font-bold text-foreground block break-all leading-tight">
                          {event.venue}
                        </span>
                        <span className="text-xs text-muted-foreground/80 dark:text-muted-foreground">
                          Tap button to navigate
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Button: Removed hardcoded whites and grays */}
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full sm:w-auto shrink-0 gap-2 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 border-border dark:hover:bg-secondary/50"
                    >
                      <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">
                        Open in Google Maps <ExternalLink className="w-4 h-4" /> 
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Memories */}
              {event.memories && event.memories.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-border">
                   <div className="flex items-center gap-2"><ImageIcon className="w-6 h-6 text-primary" /><h3 className="text-2xl font-semibold">Event Memories</h3></div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {event.memories.map((memory, idx) => (
                       <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl bg-muted cursor-pointer border border-border" onClick={() => setSelectedImage(getImageUrl(memory.url || memory))}>
                         <img src={getImageUrl(memory.url || memory)} alt={`Memory ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy"/>
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" /></div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sidebar */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="glass rounded-2xl p-6 border border-border/50 shadow-xl backdrop-blur-xl">
                  <div className="space-y-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary"><Calendar className="w-6 h-6" /></div>
                      <div>
                        <p className="font-bold text-lg text-foreground">{isDateValid ? format(eventDateObj, "EEEE, MMM d, yyyy") : "Date TBA"}</p>
                        <p className="text-muted-foreground">{isDateValid ? format(eventDateObj, "h:mm a") : "Time TBA"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary"><MapPin className="w-6 h-6" /></div>
                      <div>
                        <p className="font-bold text-lg text-foreground break-words">{event.venue}</p>
                        <p className="text-muted-foreground text-sm">View Map</p>
                      </div>
                    </div>
                  </div>

                  {event.status === "cancelled" ? (
                    <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-center font-bold border border-destructive/20 flex flex-col items-center gap-2"><AlertCircle className="w-6 h-6" /> Event Cancelled</div>
                  ) : isEventOver ? (
                    <div className="bg-secondary/50 rounded-xl p-4 text-center border border-border"><p className="font-medium text-muted-foreground">This event has ended</p></div>
                  ) : (
                    !isRegistering ? (
                      <div className="space-y-3">
                          <Button className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]" onClick={() => setIsRegistering(true)} disabled={!event.isRegistrationEnabled}>
                           {event.isRegistrationEnabled ? "Register Now" : "Registration Closed"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">{event.maxAttendees ? `${event.maxAttendees} spots available` : "Limited capacity"}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-3">
                          <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all" />
                          <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all" />
                          <input type="tel" placeholder="Phone (Optional)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" type="button" onClick={() => setIsRegistering(false)}>Cancel</Button>
                          <Button className="flex-1 font-bold" type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}</Button>
                        </div>
                      </form>
                    )
                  )}
                </div>
                <div className="glass rounded-xl p-4 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors" onClick={handleShare}>
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><Share2 className="w-5 h-5 text-foreground"/></div><div><p className="font-semibold text-sm">Share Event</p><p className="text-xs text-muted-foreground">Invite friends</p></div></div>
                    <Button variant="ghost" size="icon"><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X className="w-8 h-8" /></button>
          <img src={selectedImage} alt="Preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); handleDownload(selectedImage); }} className="absolute bottom-8 right-8 flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"><Download className="w-5 h-5" /> Download</button>
        </div>
      )}
    </div>
  );
};

export default EventDetail;