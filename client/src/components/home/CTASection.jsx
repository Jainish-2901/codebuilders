import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-12 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10" />
      {/* Responsive blur orb size */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[400px] bg-primary/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Adjusted padding for mobile (p-6) vs desktop (p-16) */}
        <div className="glass rounded-3xl p-6 md:p-16 text-center max-w-4xl mx-auto border-primary/20 glow-box">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 md:mb-8">
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm font-medium">Join 10,000+ Developers</span>
          </div>

          {/* Heading with responsive text sizes */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            Ready to Level Up Your{" "}
            <span className="text-gradient block sm:inline mt-1 sm:mt-0">Development Journey?</span>
          </h2>

          <p className="text-muted-foreground text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto">
            Get exclusive access to workshops, networking opportunities, and 
            early bird tickets. No spam, just pure developer content.
          </p>

          {/* Button container: Full width on mobile, auto on desktop */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <Link to="/events" className="w-full sm:w-auto">
              <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                Browse Events
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Trust badges: Grid on very small screens, Flex on larger */}
          <div className="mt-8 md:mt-12 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 md:gap-8 text-muted-foreground">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs md:text-sm whitespace-nowrap">Free Registration</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs md:text-sm whitespace-nowrap">Instant Tickets</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs md:text-sm whitespace-nowrap">Instant Messages</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs md:text-sm whitespace-nowrap">Digital Certificates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}