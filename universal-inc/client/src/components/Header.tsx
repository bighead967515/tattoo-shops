import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Search, Menu, Moon, Sun } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src={APP_LOGO} alt="Universal Inc" className="h-10 w-10" />
            <span className="text-xl font-bold text-foreground">Universal Inc</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Tattoos
            </Link>
            <Link href="/artists" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Browse Artists
            </Link>
            <Link href="/artist-finder" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Artist Finder
            </Link>
            <Link href="/for-artists" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              For Artists
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-foreground" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </Button>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button 
                  variant="ghost" 
                  className="hidden md:inline-flex hover:scale-105 transition-all duration-300 hover:shadow-[0_0_15px_rgba(112,255,112,0.5)]"
                >
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                className="hidden md:inline-flex hover:scale-105 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,112,255,0.5)]"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="relative overflow-hidden group hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(112,255,112,0.6)] border-primary/50 hover:border-primary"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="default" 
                  className="relative overflow-hidden group hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(112,255,112,0.4)] hover:shadow-[0_0_25px_rgba(112,255,112,0.8)] bg-primary hover:bg-primary/90"
                >
                  <span className="relative z-10 font-semibold">Sign Up Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
