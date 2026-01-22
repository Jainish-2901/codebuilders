import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowLeft, Loader2, Share2, ExternalLink, User, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, isPast } from "date-fns";
import { useExternalEvent } from "@/hooks/useExternalEvents";

const ExternalEventDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const location = useLocation();
  const { data: event, isLoading, error } = useExternalEvent(id);

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith("http") || imagePath.startsWith("https")) return imagePath;
    return imagePath;
  };

  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const shareText = `Check out this ${event?.type}: ${event?.title}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share canceled", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({ title: "Link Copied", description: "Event link copied to clipboard." });
    }
  };

  // Check if event type is hackathon OR if we passed 'hackathon' state from the previous page
  const isHackathon = event?.type === 'hackathon' || location.state?.from === 'hackathon';
  const backLink = isHackathon ? "/hackathons" : "/external-events";
  const backText = isHackathon ? "Back to Hackathons" : "Back to External Events";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">The content you're looking for doesn't exist.</p>
            <Link to={backLink}>
              <Button>{backText}</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const eventDateObj = new Date(event.date);
  const isDateValid = isValid(eventDateObj);
  const displayImage = getImageUrl(event.imageUrl);

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Helmet>
        <title>{event.title} | CodeBuilders</title>
        <meta name="description" content={event.description} />
      </Helmet>
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">

            {/* ✅ Dynamic Back Button for Main View */}
            <Link to={backLink} className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> {backText}
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
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase ${event.type === "hackathon"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                    } flex items-center gap-2`}>
                    {event.type === "hackathon" ? <Trophy className="w-4 h-4" /> : null}
                    {event.type}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase ${event.status === "upcoming"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}>
                    {event.status}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight break-words">{event.title}</h1>

                <div className="flex flex-wrap items-center gap-4">
                  {event.organizer && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Organized By</p>
                        <span className="font-medium text-foreground">{event.organizer}</span>
                      </div>
                    </div>
                  )}
                  <Button variant="outline" size="icon" className="hidden md:flex rounded-full h-10 w-10 border-border/50 bg-background/50 backdrop-blur-sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="glass rounded-2xl p-8 border border-border/50 shadow-xl backdrop-blur-xl">
                <h2 className="text-2xl font-bold mb-6">About This Event</h2>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  <p className="text-foreground text-lg leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Visit Event CTA */}
              <div className="glass rounded-2xl p-8 border border-border/50 shadow-xl backdrop-blur-xl">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    {event.type === "hackathon" ? "Ready to Join the Challenge?" : "Ready to Participate?"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {event.type === "hackathon"
                      ? "Click below to register and start building amazing solutions!"
                      : "Visit the event page to learn more and get involved."
                    }
                  </p>
                  <Button asChild size="lg" className="text-lg px-8 py-4">
                    <a href={event.link} target="_blank" rel="noopener noreferrer">
                      {event.type === "hackathon" ? "Join Hackathon" : "Visit Event"}
                      <ExternalLink className="w-5 h-5 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - SIDEBAR */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="glass rounded-2xl p-6 border border-border/50 shadow-xl backdrop-blur-xl">
                  <h3 className="text-xl font-bold mb-6">Event Details</h3>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
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

                    {event.venue && (
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">Location</p>
                          <p className="text-muted-foreground">{event.venue}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <ExternalLink className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-foreground">Event Link</p>
                        <p className="text-muted-foreground break-all">{event.link}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <Button asChild className="w-full" size="lg">
                      <a href={event.link} target="_blank" rel="noopener noreferrer">
                        {event.type === "hackathon" ? "Join Hackathon" : "Visit Event"}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExternalEventDetail;