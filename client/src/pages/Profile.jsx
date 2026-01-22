import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Shield, Phone, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    form.reset({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
  }, [user, navigate, form]);

  // ✅ New Logic: Handle Back Navigation based on Role
  const handleBack = () => {
    if (user?.role === 'volunteer') {
      navigate('/volunteer');
    }
    else {
      navigate('/');
    }
  };

  const onSubmit = async (data) => {
    setIsUpdating(true);
    try {
      await apiClient.updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone
      });

      toast({ title: 'Success', description: 'Profile updated successfully!' });

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Update failed";
      toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut();
    navigate('/');
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background bg-grid flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  console.log("Rendering Profile for user:", user);

  return (
    <div className="min-h-screen bg-background bg-grid py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">

          <Card className="glass glow-box relative">

            {/* ✅ Updated Back Button with Logic */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
              title={user.role === 'volunteer' ? "Back to Dashboard" : "Back to Home"}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <CardHeader className="text-center pt-10">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">My Profile</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage your account information
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User Info Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Update Profile Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Update Profile</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-input border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" className="bg-input border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+91 1234567890"
                              className="bg-input border-border"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? (
                        <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating... </>
                      ) : ('Update Profile')}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Logout Button */}
              <div className="border-t pt-6">
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <> <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing out... </>
                  ) : ('Sign Out')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}