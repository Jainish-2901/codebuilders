import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/integrations/api/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Lock, Mail, Shield, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react"; 
import { Helmet } from "react-helmet-async";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.updateProfile({ name: formData.name });
      if(refreshUser) await refreshUser(); 
      toast({ title: "Profile Updated", description: "Your details have been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast({ variant: "destructive", title: "Error", description: "New passwords do not match." });
    }
    
    setIsLoading(true);
    try {
      await apiClient.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast({ title: "Success", description: "Your password has been changed." });
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const Layout = user?.role === "admin" ? AdminLayout : VolunteerLayout;

  if (!user) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

  return (
    <Layout>
      <Helmet>
        <title>My Profile | CodeBuilders</title>
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-8 pb-10">
        
        {/* Volunteer Back Button */}
        {user.role === 'volunteer' && (
          <div className="pt-4">
            <Button asChild variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary text-muted-foreground">
              <Link to="/volunteer">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        )}

        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: User Card */}
          <div className="md:col-span-4 space-y-6">
            <Card className="border-border shadow-sm bg-card">
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary/10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="uppercase tracking-widest px-3 py-1">
                  {user.role}
                </Badge>

                {user.role === 'volunteer' && (
                  <div className="mt-6 w-full bg-secondary/50 p-4 rounded-lg border border-border text-left">
                    <div className="flex items-center gap-2 mb-2 text-primary font-semibold">
                      <Shield className="w-4 h-4" /> Volunteer Status
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You are a registered volunteer. Your activity is being tracked by admins.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Settings Forms */}
          <div className="md:col-span-8 space-y-6">
            
            {/* 1. General Information Form */}
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-primary" /> General Information
                </CardTitle>
                <CardDescription>Update your public display name.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        value={formData.email} 
                        disabled 
                        className="pl-9 bg-muted text-muted-foreground cursor-not-allowed border-border" 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Email cannot be changed manually.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="pl-9 bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 2. Security Form */}
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Lock className="w-5 h-5 text-primary" /> Security
                </CardTitle>
                <CardDescription>Update your password to keep your account safe.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  
                  {/* Current Password */}
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword" 
                        type={showPassword.current ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        required
                        className="pr-10 bg-background border-border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => toggleVisibility('current')}
                      >
                        {showPassword.current ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input 
                          id="newPassword" 
                          type={showPassword.new ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          required
                          className="pr-10 bg-background border-border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleVisibility('new')}
                        >
                          {showPassword.new ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input 
                          id="confirmPassword" 
                          type={showPassword.confirm ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          required
                          className="pr-10 bg-background border-border"
                        />
                         <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleVisibility('confirm')}
                        >
                          {showPassword.confirm ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="outline" disabled={isLoading} className="border-border hover:bg-secondary">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}