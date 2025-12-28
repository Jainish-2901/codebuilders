import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, KeyRound, Timer, Eye, EyeOff } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // --- REMOVED AUTH CHECK ---
  // This page is now PUBLIC so anyone can access it to recover their account.
  
  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Password
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  
  // Form Data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => `${seconds}s`;

  // --- HANDLERS ---

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "Required", description: "Please enter your email." });
      return;
    }

    setLoading(true);
    try {
      // The backend should check if email exists. 
      // If it exists, send OTP. If not, it should throw an error (e.g. 404 Not Found).
      await apiClient.requestPasswordReset(email);
      
      setStep(2);
      setTimer(60); // Start 60s timer
      toast({ title: "OTP Sent", description: "Please check your inbox for the code." });
    } catch (error) {
      // Handle "Email not found" error specifically if your API returns a clear message
      const msg = error.message || "Failed to send OTP.";
      
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("register")) {
          toast({ 
              variant: "destructive", 
              title: "Email Not Found", 
              description: "This email is not registered with us." 
          });
      } else {
          toast({ variant: "destructive", title: "Error", description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "OTP must be exactly 6 digits." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      await apiClient.resetPassword(email, otp, newPassword);
      toast({ title: "Success", description: "Password reset successfully. You can now login." });
      navigate('/auth'); // Redirect to login page
    } catch (error) {
      toast({ variant: "destructive", title: "Reset Failed", description: error.message || "Invalid OTP or expired." });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await apiClient.requestPasswordReset(email);
      setTimer(60);
      toast({ title: "OTP Resent", description: "A new code has been sent to your email." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not resend OTP." });
    } finally {
      setLoading(false);
    }
  };

  // Input Handlers
  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 6) {
        setOtp(val);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <Card className="w-full max-w-md glass glow-box relative z-10 shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 ring-4 ring-primary/5">
              {step === 1 ? (
                <Mail className="w-8 h-8 text-primary" />
              ) : (
                <KeyRound className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {step === 1 ? "Forgot Password" : "Verify & Reset"}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {step === 1 
              ? "Enter your registered email to receive a verification code." 
              : `Enter the code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          
          {step === 1 ? (
            /* --- STEP 1: EMAIL FORM --- */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            /* --- STEP 2: OTP & PASSWORD FORM --- */
            <form onSubmit={handleResetPassword} className="space-y-5">
              
              {/* OTP Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">One-Time Password (OTP)</label>
                <div className="relative">
                    <Input 
                        value={otp}
                        onChange={handleOtpChange}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •" 
                        className="bg-background text-center tracking-[1em] text-lg font-bold h-12" 
                        disabled={loading}
                    />
                </div>
                {otp.length > 0 && otp.length < 6 && (
                    <p className="text-xs text-red-500 font-medium text-center">Must be 6 digits</p>
                )}
              </div>
              
              {/* New Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">New Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password" 
                    className="bg-background pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Reset Password"}
              </Button>

              {/* Timer & Resend */}
              <div className="flex flex-col items-center gap-3 pt-2">
                {timer > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-orange-600 font-medium bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
                    <Timer className="w-4 h-4" />
                    Code expires in {formatTime(timer)}
                  </div>
                ) : (
                   <div className="text-sm text-center">
                     <span className="text-muted-foreground">Didn't receive code? </span>
                     <button 
                       type="button" 
                       onClick={handleResend}
                       disabled={loading}
                       className="text-primary font-semibold hover:underline"
                     >
                       Resend OTP
                     </button>
                   </div>
                )}
              </div>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </Link>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}