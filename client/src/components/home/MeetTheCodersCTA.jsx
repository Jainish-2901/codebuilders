import { ArrowRight, Code2 } from "lucide-react";
import { Link } from "react-router-dom";

const MeetTheCodersCTA = () => {
  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10" />
      {/* Responsive blur orb size */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[250px] md:w-[800px] md:h-[400px] bg-primary/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Adjusted padding and border radius for mobile */}
        <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-16 text-center max-w-4xl mx-auto border-primary/20 glow-box">
        
          {/* Label */}
          <span className="text-primary font-mono text-xs md:text-sm uppercase tracking-wider block mb-4">
            // The Humans Behind the Code
          </span>

          {/* Title - Responsive text scaling */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            Meet the <span className="text-primary">Coders</span>
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8 md:mb-10 px-2">
            Built by developers who actually write the code, break the builds,
            and ship the fixes.
          </p>

          {/* CTA - Full width on mobile, auto on desktop */}
          <div className="flex justify-center">
            <Link
              to="/developers"
              className="inline-flex w-full sm:w-auto justify-center items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition active:scale-95 duration-200"
            >
              Meet the Coders
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Footer line */}
          <p className="mt-6 text-xs md:text-sm text-muted-foreground font-mono">
            Built by developers, for developers.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MeetTheCodersCTA;