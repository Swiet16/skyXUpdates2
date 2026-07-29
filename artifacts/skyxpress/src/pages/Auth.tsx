import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, CheckCircle2 } from "lucide-react";

const Auth = () => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // sign-up extra fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");

  // first-login password change
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  /* ── Sign-in ─────────────────────────────────────────────────── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: "destructive", title: "Sign in failed", description: error.message });
        return;
      }
      if (data.user) {
        // Check if this is a partner who still has a temp_password (first login)
        const { data: partnerData } = await supabase
          .from("partners")
          .select("id, temp_password")
          .eq("email", data.user.email)
          .maybeSingle();

        if (partnerData?.temp_password) {
          setPartnerId(partnerData.id);
          setMustChangePassword(true);
          return; // stay on page — show change-password step
        }

        toast({ title: "Welcome back!", description: "You have successfully signed in." });
        navigate("/dashboard");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── First-login password change ────────────────────────────── */
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Too short", description: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "Passwords don't match." });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Clear temp_password so they won't be prompted again
      if (partnerId) {
        await supabase
          .from("partners")
          .update({ temp_password: null })
          .eq("id", partnerId);
      }

      toast({ title: "Password updated!", description: "You're now signed in." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Could not update password." });
    } finally {
      setChangingPassword(false);
    }
  };

  /* ── Sign-up ─────────────────────────────────────────────────── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName, company },
        },
      });
      if (error) {
        toast({ variant: "destructive", title: "Sign up failed", description: error.message });
      } else if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        navigate("/");
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Set-new-password screen (first login) ───────────────────── */
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center px-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
          .auth-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
          @keyframes auth-glow { 0%,100%{box-shadow:0 0 18px 3px rgba(46,134,255,.18)} 50%{box-shadow:0 0 30px 6px rgba(46,134,255,.30)} }
          .auth-ring { animation: auth-glow 3s ease-in-out infinite; }
        `}</style>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#2E86FF] to-[#FF6A1A] flex items-center justify-center auth-ring">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <span className="auth-display text-xl font-bold text-white">SkyXpress</span>
            </div>
            <h1 className="auth-display text-3xl font-bold text-white mb-2">Set your password</h1>
            <p className="text-white/45 text-sm">You're logging in for the first time. Create a secure password to continue.</p>
          </div>

          <form onSubmit={handleSetNewPassword}
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-white/60 text-xs uppercase tracking-wide">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-12 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 pr-11 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                />
                <button type="button" onClick={() => setShowNewPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60 text-xs uppercase tracking-wide">Confirm Password</Label>
              <Input
                type="password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
              />
            </div>
            <Button type="submit" disabled={changingPassword}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2E86FF] to-[#FF6A1A] text-white font-semibold text-base hover:opacity-90 transition-opacity border-0">
              {changingPassword
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><CheckCircle2 className="mr-2 h-4 w-4" />Set Password & Continue</>}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Main auth screen ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#06080f] flex items-center justify-center px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
        .auth-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        @keyframes auth-glow { 0%,100%{box-shadow:0 0 18px 3px rgba(46,134,255,.18)} 50%{box-shadow:0 0 30px 6px rgba(46,134,255,.30)} }
        .auth-ring { animation: auth-glow 3s ease-in-out infinite; }
        @keyframes auth-fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .auth-fadein { animation: auth-fade-in .35s ease both; }
      `}</style>

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#2E86FF]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#FF6A1A]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md auth-fadein">
        {/* Logo block */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2E86FF] to-[#1A4FCC] flex items-center justify-center shadow-xl auth-ring">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white fill-current">
                <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="auth-display text-xl font-bold text-white leading-none">SkyXpress</p>
              <p className="text-[11px] text-white/35 tracking-wide">International Courier</p>
            </div>
          </div>
          <h1 className="auth-display text-3xl font-bold text-white">
            {tab === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {tab === "signin"
              ? "Sign in to manage your shipments"
              : "Join SkyXpress for fast global shipping"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-white/[0.05] border border-white/8 p-1 mb-6">
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t
                  ? "bg-gradient-to-r from-[#2E86FF] to-[#1A4FCC] text-white shadow-lg"
                  : "text-white/40 hover:text-white/70"
              }`}>
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8">
          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wide">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wide">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-11 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2E86FF] to-[#1A4FCC] hover:opacity-90 text-white font-semibold text-base border-0 transition-opacity shadow-lg shadow-[#2E86FF]/20 mt-2">
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                  : <><span>Sign In</span><ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wide">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12 pl-9 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wide">Company</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                    <Input
                      type="text"
                      placeholder="Optional"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="h-12 pl-9 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wide">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wide">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-11 bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#2E86FF]/60 focus-visible:ring-2 focus-visible:ring-[#2E86FF]/20"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF6A1A] to-[#e05508] hover:opacity-90 text-white font-semibold text-base border-0 transition-opacity shadow-lg shadow-[#FF6A1A]/20 mt-2">
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</>
                  : <><span>Create Account</span><ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/20 mt-6">
          By continuing you agree to SkyXpress's Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Auth;
