import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";
import { format, isValid, isPast, isToday } from "date-fns";
import { useFeaturedEvents } from "@/hooks/useEvents";

const apiUrl = import.meta.env.VITE_API_URL;

export function FeaturedEvents() {
  const { data: events = [], isLoading } = useFeaturedEvents(3);

  // Fallback Image
  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith("http") || imagePath.startsWith("https")) {
      return imagePath;
    }
    const cleanPath = imagePath.replace(/\\/g, "/");
    const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${normalizedPath}`;
  };

  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  // ✅ FILTER & SORT LOGIC
  const upcomingEvents = events
    .filter((event) => {
        const rawDate = event.dateTime || event.date;
        const eventDateObj = new Date(rawDate);
        return isValid(eventDateObj) && (!isPast(eventDateObj) || isToday(eventDateObj));
    })
    .sort((a, b) => {
        const dateA = new Date(a.dateTime || a.date);
        const dateB = new Date(b.dateTime || b.date);
        return dateA - dateB;
    });

  return (
    <section className="py-12 md:py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-16">
          <span className="text-blue-600 font-mono text-sm tracking-wider uppercase">
            // Upcoming Events
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 md:mb-6">
            Don't Miss Out
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Register for our upcoming events and be part of the most exciting
            tech community gatherings.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* ✅ Events Grid (Responsive: 1 col on mobile, 2 on tablet, 3 on desktop) */}
        {!isLoading && upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {upcomingEvents.map((event, index) => {

              const rawDate = event.dateTime || event.date;
              const eventDateObj = new Date(rawDate);
              const isDateValid = isValid(eventDateObj);

              // ✅ Status Logic (Time Aware)
              const isEventToday = isToday(eventDateObj);
              const isEventPast = isPast(eventDateObj); 

              let displayStatus = "Upcoming";
              // Badge color forced to Blue
              let statusColorClass = "bg-blue-600 text-white"; 

              if (isEventToday) {
                  if (isEventPast) {
                      displayStatus = "Happened Today";
                      statusColorClass = "bg-muted text-muted-foreground"; 
                  } else {
                      displayStatus = "Happening Today";
                      statusColorClass = "bg-green-600 text-white animate-pulse shadow-lg shadow-green-500/20"; 
                  }
              }

              const buttonText = isEventPast ? "View Details" : "Register Now";
              
              // ✅ BUTTON LOGIC:
              // Light Mode: text-white
              // Dark Mode: dark:text-black
              const buttonClasses = isEventPast 
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                : "bg-blue-600 text-white dark:text-black hover:bg-blue-700 shadow-md shadow-blue-500/20";

              const displayImage = getImageUrl(event.imageUrl || event.image_url);

              return (
                <Link
                  to={`/events/${event._id}`}
                  key={event._id}
                  className="group glass rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 animate-fade-in h-full flex flex-col"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden shrink-0">
                    <img
                      src={displayImage}
                      alt={event.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold uppercase",
                        statusColorClass
                      )}>
                        {displayStatus}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
                      {event.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        {isDateValid ? format(eventDateObj, "MMM d, yyyy") : "TBA"}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="truncate max-w-[100px]">{event.venue}</span>
                      </div>
                      {(event.max_attendees || event.maxAttendees) && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          {event.maxAttendees || event.max_attendees}+ spots
                        </div>
                      )}
                    </div>

                    {/* ✅ EXACT BUTTON STRUCTURE */}
                    <div 
                        className={cn(
                          "h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                          "w-full",
                          buttonClasses
                        )}
                      >
                      {buttonText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
            !isLoading && (
                <div className="text-center py-8 mb-8">
                    <p className="text-muted-foreground">No upcoming events scheduled at the moment.</p>
                </div>
            )
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link to="/events" className="w-full sm:w-auto inline-block">
            <Button 
                size="lg" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:text-black shadow-lg shadow-blue-500/25 border-none"
            >
              View All Events
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}