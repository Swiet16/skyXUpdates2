import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  user?: any;
}

const Header = ({ user }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark, toggle } = useTheme();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ variant: "destructive", title: "Error signing out", description: error.message });
    } else {
      toast({ title: "Signed out successfully" });
      navigate("/");
    }
  };

  const ThemeToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {[
        { to: "/services", label: "Services" },
        { to: "/network", label: "Our Network" },
        { to: "/about", label: "About Us" },
        { to: "/contact", label: "Contact Us" },
      ].map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          onClick={onClick}
          className="text-foreground hover:text-primary transition-colors font-medium"
        >
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Desktop */}
        <div className="hidden md:flex flex-col items-center py-4">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <Link to="/" className="flex items-center group">
              <img
                src="https://thunaolandjuvuhvbsds.supabase.co/storage/v1/object/public/File/Logo1.png"
                alt="SkyXpress Logo"
                className="h-[280px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Nav + Auth + Theme */}
          <div className="flex items-center justify-center w-full gap-8">
            <nav className="flex items-center space-x-8">
              <NavLinks />
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col items-center py-3">
          {/* Logo */}
          <div className="flex items-center justify-center mb-3">
            <Link to="/" className="flex items-center group">
              <img
                src="https://thunaolandjuvuhvbsds.supabase.co/storage/v1/object/public/File/Logo1.png"
                alt="SkyXpress Logo"
                className="h-[140px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* Mobile controls row */}
          <div className="flex items-center gap-2 w-full max-w-xs">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="flex-1 justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5 mr-2" /> : <Menu className="h-5 w-5 mr-2" />}
              Navigation
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="py-4 border-t border-border w-full mt-2">
              <nav className="flex flex-col space-y-3 items-center">
                <NavLinks onClick={() => setIsMenuOpen(false)} />
                <div className="flex flex-col gap-2 w-full max-w-xs pt-3 border-t border-border">
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full">Dashboard</Button>
                      </Link>
                      <Button variant="outline" onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="w-full">
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full">Sign In</Button>
                      </Link>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full bg-primary hover:bg-primary/90">Get Started</Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
