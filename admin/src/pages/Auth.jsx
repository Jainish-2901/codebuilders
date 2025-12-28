import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react'; // Added Eye icons

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  const { signIn, user, isAdmin, isVolunteer } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (isAdmin) navigate('/admin');
      else if (isVolunteer) navigate('/volunteer');
      else navigate('/'); 
    }
  }, [user, isAdmin, isVolunteer, navigate]);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      if (result.error) {
        const errorMessage = typeof result.error === 'string' ? result.error : result.error?.message || "Invalid email or password";
        toast({ variant: 'destructive', title: 'Login Failed', description: errorMessage });
      } else {
        toast({ title: 'Success', description: 'Logged in successfully!' });
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      toast({ variant: 'destructive', title: 'System Error', description: "Something went wrong." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <Card className="w-full max-w-md glass glow-box relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <img className="w-8 h-8 text-primary" src="/favicon.ico" alt="Logo" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Staff Login</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access admin dashboard or volunteer panel
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" className="bg-input border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel>Password</FormLabel>
                        {/* Forgot Password Link */}
                        <Link 
                          to="/forgot-password" 
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Forgot Password?
                        </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-input border-border pr-10"
                          {...field}
                        />
                        {/* Toggle Password Visibility */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in... </>
                ) : ( 'Sign In' )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              ← Back to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}