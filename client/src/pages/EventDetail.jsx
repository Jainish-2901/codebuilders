import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext"; // ✅ IMPORT AUTH CONTEXT
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, ArrowLeft, Loader2, Share2, ShieldCheck, AlertCircle, Copy, Image as ImageIcon, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, isPast, addHours } from "date-fns";
import AddToCalendar from "@/components/events/AddToCalendar";

const apiUrl = import.meta.env.VITE_API_URL;

// --- Sidebar Component ---
const EventSidebar = ({
  event,
  user,
  formData,
  setFormData,
  isRegistering,
  setIsRegistering,
  isSubmitting,
  handleRegister,
  handleShare,
  isDateValid,
  eventDateObj,
  isEventOver,
  isUserRegisteredForEvent,
  registeredTokenId
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleRegistrationClick = () => {
    // LOGIC 1: Check Global Auth State
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to register for this event.",
        variant: "default",
      });
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // LOGIC 2: If Logged In, Open Form (Data is already autofilled)
    setIsRegistering(true);
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 border border-border/50 shadow-xl backdrop-blur-xl">
        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">
                {isDateValid ? format(eventDateObj, "EEEE, MMM d, yyyy") : "Date TBA"}
              </p>
              <p className="text-muted-foreground">
                {isDateValid ? format(eventDateObj, "h:mm a") : "Time TBA"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground break-words">{event.venue}</p>
              {event.mapUrl ? (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground text-sm hover:text-primary hover:underline transition-colors flex items-center gap-1"
                >
                  View Map <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">Map unavailable</p>
              )}
            </div>
          </div>
        </div>

        {event.status === "cancelled" ? (
          <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-center font-bold border border-destructive/20 flex flex-col items-center gap-2">
            <AlertCircle className="w-6 h-6" /> Event Cancelled
          </div>
        ) : isEventOver ? (
          <div className="bg-secondary/50 rounded-xl p-4 text-center border border-border">
            <p className="font-medium text-muted-foreground">This event has ended</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* CTA BUTTON */}
            {!isRegistering && (
              <div className="space-y-3">

                {isUserRegisteredForEvent ? (
                  <Link to={`/ticket/${registeredTokenId}`} className="w-full">
                    <Button className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                      View Ticket
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className={`
          w-full h-12 text-lg font-bold transition-all
          ${!event.isRegistrationEnabled
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : !user
                          ? "bg-secondary hover:bg-secondary/80 text-foreground"
                          : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:scale-[1.02]"
                      }
        `}
                    onClick={handleRegistrationClick}
                    disabled={!event.isRegistrationEnabled}
                  >
                    {!event.isRegistrationEnabled
                      ? "Registration Closed"
                      : !user
                        ? "Login to Register"
                        : "Register Now"}
                  </Button>
                )}

                {!isUserRegisteredForEvent && (
                  <p className="text-xs text-center text-muted-foreground">
                    {event.maxAttendees
                      ? `${event.maxAttendees - (event.registrationCount || 0)} spots available`
                      : "Limited capacity"}
                  </p>
                )}

              </div>
            )}


            {/* REGISTRATION FORM */}
            <form onSubmit={handleRegister} className={`space-y-4 ${!isRegistering ? "hidden" : "block"}`}>
              <h4 className="text-lg font-semibold text-center">Complete Your Registration</h4>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setIsRegistering(false)}>Cancel</Button>
                <Button className="flex-1 font-bold" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div
        className="glass rounded-xl p-4 border border-border/50 items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors hidden md:flex"
        onClick={handleShare}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Share2 className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Share Event</p>
            <p className="text-xs text-muted-foreground">Invite friends</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// --- Main Component ---
const EventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [isUserRegisteredForEvent, setIsUserRegisteredForEvent] = useState(false);
  const [registeredTokenId, setRegisteredTokenId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80";

  // ✅ 2. Auto-Fill Effect: Runs whenever `user` changes (e.g., after login)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/registrations/is-registered/${id}`,
          { withCredentials: true }
        );

        setIsUserRegisteredForEvent(res.data.isRegistered);
        if (res.data.tokenId) {
          setRegisteredTokenId(res.data.tokenId);
        }
      } catch (err) {
        console.error("Check registration failed", err);
        setIsUserRegisteredForEvent(false);
      }
    };

    if (user && id) {
      checkRegistration();
    }
  }, [user, id]);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/events/${id}`);
        setEvent(res.data);
      } catch (error) {
        console.error("Event not found", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) { fetchEvent(); }
  }, [id]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/registrations`, {
        eventId: event._id,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone
      }, { withCredentials: true });

      toast({ title: "Registration Successful!", description: "Check your email for the ticket." });
      setIsRegistering(false);
      setIsUserRegisteredForEvent(true);
      // Optional: Don't clear form immediately to improve UX
      // setFormData({ name: "", email: "", phone: "" }); 

    } catch (err) {
      toast({ title: "Registration Failed", description: err.response?.data?.message || "Something went wrong.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith("http") || imagePath.startsWith("https")) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, "/");
    const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${normalizedPath}`;
  };

  const handleImageError = (e) => { e.target.src = PLACEHOLDER_IMAGE; };

  const displayImage = event ? getImageUrl(event.imageUrl || event.image_url) : PLACEHOLDER_IMAGE;

  const handleShare = async () => {
    if (!event) return;
    const eventDate = new Date(event.dateTime).toDateString();
    const eventTime = new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const shortDesc = event.description
      ? (event.description.length > 100 ? event.description.substring(0, 97) + "..." : event.description)
      : "Join us to learn and grow!";

    const shareTitle = `🚀 Event Alert: ${event.title}`;
    const shareText = `🚀 *Event Alert: ${event.title}*\n\nReady to level up? Join us for an exclusive session at CodeBuilders!\n\n📅 *Date:* ${eventDate} at ${eventTime}\n📍 *Venue:* ${event.venue}\n💡 *Topic:* ${shortDesc}\n\n👇 *Register & Details:*`;

    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log("Share canceled", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({ title: "Link Copied", description: "Event link copied to clipboard." });
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
        <meta property="og:title" content={`Event: ${event.title}`} />
        <meta property="og:description" content={event.description} />
        <meta property="og:image" content={displayImage} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description} />
        <meta name="twitter:image" content={displayImage} />
      </Helmet>

      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <Link to="/events" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
            </Link>
            <Button variant="outline" size="icon" className="md:hidden rounded-full h-10 w-10 border-border/50 bg-background/50 backdrop-blur-sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-10">
              <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                <img src={displayImage} alt={event.title} onError={handleImageError} className="w-full h-full object-contain" />
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight break-words">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Hosted By</p><span className="font-medium text-foreground">CodeBuilders Team</span></div>
                  </div>
                  {isDateValid && (
                    <AddToCalendar event={{
                      title: event.title, description: event.description, venue: event.venue,
                      date: format(eventDateObj, 'yyyy-MM-dd'), startTime: format(eventDateObj, 'HH:mm'), endTime: format(addHours(eventDateObj, 2), 'HH:mm')
                    }} />
                  )}
                </div>
              </div>

              {/* Mobile Sidebar */}
              <div className="block lg:hidden mt-8 mb-8">
                <EventSidebar
                  event={event} user={user} formData={formData} setFormData={setFormData}
                  isRegistering={isRegistering} setIsRegistering={setIsRegistering} isSubmitting={isSubmitting}
                  handleRegister={handleRegister} handleShare={handleShare} isDateValid={isDateValid}
                  eventDateObj={eventDateObj} isEventOver={isEventOver}
                  isUserRegisteredForEvent={isUserRegisteredForEvent}
                  registeredTokenId={registeredTokenId}
                />
              </div>

              <div className="prose prose-lg prose-invert max-w-none">
                <h3 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-4">About Event</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">{event.fullDescription || event.description}</p>
              </div>

              {event.mapUrl && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold border-l-4 border-primary pl-4">Location</h3>
                  <div className="w-full h-[350px] rounded-xl overflow-hidden border border-border shadow-sm bg-muted relative">
                    <iframe src={event.mapUrl.includes("embed") ? event.mapUrl : getEmbedUrl(event.mapUrl)} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Event Location"></iframe>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-secondary/30 dark:bg-secondary/10 p-4 rounded-xl border border-border/50 backdrop-blur-sm transition-colors duration-300">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-12 h-12 rounded-2xl bg-background dark:bg-card flex items-center justify-center border border-border shadow-sm shrink-0"><MapPin className="w-6 h-6 text-primary" /></div>
                      <div><span className="font-bold text-foreground block break-all leading-tight">{event.venue}</span><span className="text-xs text-muted-foreground/80 dark:text-muted-foreground">Tap button to navigate</span></div>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto shrink-0 gap-2 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 border-border dark:hover:bg-secondary/50">
                      <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps <ExternalLink className="w-4 h-4" /></a>
                    </Button>
                  </div>
                </div>
              )}

              {event.memoriesUrl && (
                <div className="space-y-6 pt-8 border-t border-border mt-8">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-primary" />
                    <h3 className="text-2xl font-semibold">Event Memories</h3>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-6 border border-border text-center">
                    <p className="text-muted-foreground mb-4">Check out the photo gallery from this event on our external album!</p>
                    <Button asChild size="lg" className="font-bold gap-2">
                      <a href={event.memoriesUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /> View Photo Album</a>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-4 space-y-8">
              <div className="sticky top-24">
                <EventSidebar
                  event={event} user={user} formData={formData} setFormData={setFormData}
                  isRegistering={isRegistering} setIsRegistering={setIsRegistering} isSubmitting={isSubmitting}
                  handleRegister={handleRegister} handleShare={handleShare} isDateValid={isDateValid}
                  eventDateObj={eventDateObj} isEventOver={isEventOver}
                  isUserRegisteredForEvent={isUserRegisteredForEvent}
                  registeredTokenId={registeredTokenId}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetail;