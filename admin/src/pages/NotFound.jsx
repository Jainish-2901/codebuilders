import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Ghost, MoveLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have shadcn-ui, otherwise use standard <button>

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 font-sans">
      
      {/* --- Background Animated Blobs (The "Clips") --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* --- Main Content --- */}
      <div className="relative z-10 text-center px-4">
        
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Ghost className="w-24 h-24 text-primary animate-bounce-slow" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="mb-2 text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 drop-shadow-sm">
          404
        </h1>

        <h2 className="mb-4 text-3xl font-bold text-gray-800">
          Whoops! Lost in Space?
        </h2>
        
        <p className="mb-8 text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
          The page you are looking for doesn't exist or has been moved. 
          Don't worry, even the best explorers get lost sometimes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/">
            <Button size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
              <Home className="mr-2 w-4 h-4" />
              Return Home
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => window.history.back()}
            className="group hover:shadow-lg text-black border-gray-300"
          >
            <MoveLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform cursor-pointer" />
            Go Back
          </Button>
        </div>
      </div>

      {/* --- Custom Styles for Tailwind Animations --- */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;