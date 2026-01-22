import { Link } from "react-router-dom";
import { Github, Linkedin, Instagram, Mail, Phone, MapPin, LogIn } from "lucide-react";

export function Footer() {
  // Defined links array to easily handle the Login path
  const quickLinks = [
    { label: "Events", path: "/events" },
    { label: "Team Members", path: "/team-members" },
    { label: "Memories", path: "/memories" },
    { label: "About", path: "/about" },
    { label: "Developers", path: "/developers" },
    { label: "Contact", path: "/contact" },
    { label: "Member Login", path: "/auth" },
  ];

  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Socials */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <img className="w-6 h-6 text-primary" src="/favicon.ico" alt="Logo" />
              </div>
              <span className="font-bold text-xl">
                Code<span className="text-gradient">Builders</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Empowering developers through world-class technical events, 
              workshops, and networking opportunities. Join our community 
              and level up your skills.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/codebuilders.bca" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/code-builders-bca-74b131355" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://github.com/CodeBuilders-BCA" className="text-muted-foreground hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
              </a>
              <a href="mailto:codebuilders100@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className={`text-sm transition-colors flex items-center gap-2 ${
                      link.label === "Member Login" 
                        ? "text-primary font-medium hover:underline" 
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {link.label === "Member Login" && <LogIn className="w-3 h-3" />}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {/* Email */}
              <li>
                <a 
                  href="mailto:codebuilders100@gmail.com" 
                  className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  codebuilders100@gmail.com
                </a>
              </li>

              {/* Phone Numbers */}
              <li>
                <a 
                  href="tel:+919265328747" 
                  className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +91 92653 28747
                </a>
              </li>
              <li>
                <a 
                  href="tel:+919773272749" 
                  className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +91 97732 72749
                </a>
              </li>
              <li>
                <a 
                  href="tel:+917016798029" 
                  className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  +91 70167 98029
                </a>
              </li>

              {/* Address */}
              <li>
                <a 
                  href="https://goo.gl/maps/YOUR_REAL_MAP_LINK_HERE" // Update this if you have a real link
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-foreground hover:underline transition-colors"
                >
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  Ahmedabad, Gujarat, India
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Code Builders. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}