import { useState, useEffect } from "react";
import axios from "axios";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Loader2, Calendar, Search, ExternalLink, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom"; 

const apiUrl = import.meta.env.VITE_API_URL;

const Memories = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search States
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

  // Fetch Events with Memories Link
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await axios.get(`${apiUrl}/events`);
        
        // ✅ UPDATED LOGIC: 
        // Show ANY event that has a valid `memoriesUrl`.
        // Removed the check for `e.status === 'past'`.
        const eventsWithMemories = res.data
          .filter((e) => e.memoriesUrl && e.memoriesUrl.trim() !== "")
          .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

        setEvents(eventsWithMemories);
        setFilteredEvents(eventsWithMemories); 
      } catch (error) {
        console.error("Error loading memories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemories();
  }, []);

  // Handle Search Filtering
  useEffect(() => {
    let result = events;

    // Filter by Name
    if (searchName) {
      result = result.filter(event => 
        event.title.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by Date (Matches YYYY-MM-DD)
    if (searchDate) {
      result = result.filter(event => {
        const eventDate = new Date(event.dateTime).toISOString().split('T')[0];
        return eventDate === searchDate;
      });
    }

    setFilteredEvents(result);
  }, [searchName, searchDate, events]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith("http") || imagePath.startsWith("https")) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, "/");
    const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${normalizedPath}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="pt-24 pb-16 flex-1">
        <div className="container mx-auto px-4">
          
          {/* Header Section */}
          <div className="text-center mb-12 space-y-4">
            <span className="text-primary font-mono text-sm tracking-wider uppercase bg-primary/10 px-3 py-1 rounded-full">
              Gallery
            </span>
            <h1 className="text-4xl md:text-6xl font-bold">
              Community <span className="text-primary">Memories</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Relive the connections, the learning, and the community spirit.
              Browse photo albums from our events.
            </p>
          </div>

          {/* 🔍 Search Bar Section */}
          <div className="max-w-4xl mx-auto mb-16 bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search album by event name..." 
                  className="pl-9 bg-background"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/3 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  className="pl-9 bg-background"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
              {(searchName || searchDate) && (
                <Button 
                  variant="ghost" 
                  onClick={() => { setSearchName(""); setSearchDate(""); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading albums...</p>
            </div>
          )}

          {/* Album Grid */}
          {!isLoading && filteredEvents.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => (
                <div 
                  key={event._id} 
                  className="group glass rounded-2xl overflow-hidden border border-border flex flex-col hover:border-primary/50 transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  
                  {/* Cover Image of Event */}
                  <div className="h-56 overflow-hidden relative bg-secondary">
                      <img 
                        src={getImageUrl(event.imageUrl || event.image_url)} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <a 
                          href={event.memoriesUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white/10 backdrop-blur-md border border-white/50 text-white font-bold px-6 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors"
                        >
                          Open Album <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary mb-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.dateTime), "MMMM d, yyyy")}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-1">
                        {event.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-grow">
                        {event.description}
                    </p>
                    
                    <div className="mt-auto flex gap-3">
                      <Button asChild className="flex-1 gap-2 font-semibold">
                        <a href={event.memoriesUrl} target="_blank" rel="noopener noreferrer">
                          View Photos <ImageIcon className="w-4 h-4" />
                        </a>
                      </Button>
                      
                      <Button asChild variant="outline" size="icon">
                          <Link to={`/events/${event._id}`} title="View Event Details">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-secondary/5">
              <div className="flex justify-center mb-4">
                <Search className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-semibold text-foreground">No albums found</p>
              <p className="text-muted-foreground mt-2">
                {events.length === 0 
                  ? "We haven't uploaded any event albums yet." 
                  : "Try adjusting your search criteria."}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Memories;