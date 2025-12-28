import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom"; 
import { format, isValid, isPast, isToday, startOfDay } from "date-fns"; 
import { Calendar, MapPin, Users, ArrowRight, Search, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async"; 
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, buttonVariants } from "@/components/ui/button"; 
import { cn } from "@/lib/utils"; 

const apiUrl = import.meta.env.VITE_API_URL;

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${apiUrl}/events`);
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam && ["all", "upcoming", "past"].includes(filterParam)) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchParams(newFilter === "all" ? {} : { filter: newFilter });
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

  // ✅ HELPER: Get Category (1=Upcoming, 2=Today, 3=Past)
  const getEventCategory = (date) => {
    const today = startOfDay(new Date());
    const eventDay = startOfDay(new Date(date));

    if (eventDay > today) return 1; // Upcoming (Future Date)
    if (eventDay.getTime() === today.getTime()) return 2; // Today
    return 3; // Past
  };

  const filteredEvents = events
    .filter((event) => {
      const eventDate = new Date(event.dateTime || event.date);
      const isDateValid = isValid(eventDate);
      
      let computedStatus = event.status;
      if (isDateValid) {
        if (isPast(eventDate) && !isToday(eventDate)) {
             // If strictly past and NOT today -> Past
            computedStatus = 'past';
        } else if (!computedStatus) {
            // Future or Today -> Upcoming
            computedStatus = 'upcoming';
        }
      }
      if (!computedStatus) computedStatus = 'upcoming';

      const matchesStatus = filter === "all" ? true : computedStatus === filter;

      if (!search) return matchesStatus;

      const term = search.toLowerCase();
      const dateStrShort = isDateValid ? format(eventDate, "MMM d yyyy").toLowerCase() : "";
      const dateStrLong = isDateValid ? format(eventDate, "MMMM d yyyy").toLowerCase() : "";

      const matchesSearch =
        event.title?.toLowerCase().includes(term) ||          
        event.venue?.toLowerCase().includes(term) ||          
        event.description?.toLowerCase().includes(term) ||    
        dateStrShort.includes(term) ||                        
        dateStrLong.includes(term);                           

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.dateTime || a.date);
      const dateB = new Date(b.dateTime || b.date);

      const categoryA = getEventCategory(dateA);
      const categoryB = getEventCategory(dateB);

      // 1. Sort by Category Priority (Upcoming -> Today -> Past)
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      // 2. Tie-breakers within the same category
      if (categoryA === 3) {
         // If both are PAST, show most recent first (Descending)
         return dateB - dateA;
      } else {
         // If both are UPCOMING or TODAY, show nearest time first (Ascending)
         return dateA - dateB;
      }
    });

  const getPageTitle = () => {
      if (filter === "upcoming") return "Upcoming";
      if (filter === "past") return "Past";
      return "All";
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Events | CodeBuilders</title>
      </Helmet>

      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-mono text-sm tracking-wider uppercase">
              // Discover Events
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6">
              {getPageTitle()} <span className="text-primary">Code Builders Events</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find the perfect event to level up your skills and connect with 
              fellow developers.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, venue, date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="flex gap-2">
              {["all", "upcoming", "past"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleFilterChange(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filter === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => {
                
                const rawDate = event.dateTime || event.date;
                const eventDateObj = new Date(rawDate);
                const isDateValid = isValid(eventDateObj);
                const isEventToday = isToday(eventDateObj);
                
                let displayStatus = event.status;
                if (isDateValid) {
                   if (isEventToday) {
                     displayStatus = 'Today';
                   } else {
                     displayStatus = isPast(eventDateObj) ? 'Past' : 'Upcoming';
                   }
                }

                const displayImage = getImageUrl(event.imageUrl || event.image_url);

                return (
                  <Link
                    to={`/events/${event._id}`}
                    key={event._id}
                    className="group glass rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 h-full flex flex-col"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-200 shrink-0">
                      <img
                        src={displayImage}
                        alt={event.title}
                        onError={handleImageError} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold uppercase",
                          displayStatus === "Upcoming" && "bg-blue-600 text-white",
                          displayStatus === "Today" && "bg-green-600 text-white animate-pulse",
                          displayStatus === "Past" && "bg-muted text-foreground"
                        )}>
                          {displayStatus || 'Event'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-primary" />
                          {isDateValid ? format(eventDateObj, "MMM d, yyyy") : "TBA"}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="truncate max-w-[100px]">{event.venue}</span>
                        </div>
                        {(event.max_attendees || event.maxAttendees) && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-primary" />
                            {event.maxAttendees || event.max_attendees}+ spots
                          </div>
                        )}
                      </div>

                      <div 
                        className={cn(
                          buttonVariants({ variant: displayStatus === "Past" ? "secondary" : "outline" }),
                          "w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        )}
                      >
                        {displayStatus === "Past" ? "View Details" : "Register Now"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                      
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No events found matching your criteria.</p>
              {filter !== 'all' && (
                  <Button variant="link" onClick={() => handleFilterChange('all')}>View All Events</Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Events;