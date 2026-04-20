import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Compass,
  Users,
  MapPin,
  Palette,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  Moon,
  Sun,
  Menu,
  X,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  Settings2,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/artists", label: "Browse Artists", icon: Users },
  { href: "/artist-finder", label: "Find Artists & Shops", icon: MapPin },
  { href: "/for-artists", label: "For Artists", icon: Palette },
  { href: "/requests", label: "Request Board", icon: LayoutDashboard },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border/40">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <img src={APP_LOGO} alt="Ink Connect" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-primary">Ink</span> Connect
          </span>
        </Link>
      </div>

      {/* Post an Idea CTA */}
      <div className="px-3 py-4 border-b border-border/40">
        <Link href="/client/new-request" onClick={() => setMobileOpen(false)}>
          <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(112,255,112,0.35)] hover:shadow-[0_0_25px_rgba(112,255,112,0.6)] transition-all duration-300">
            <Lightbulb className="h-4 w-4" />
            Post an Idea
          </Button>
        </Link>
      </div>

      {/* Primary Navigation Links — always visible, takes all available space */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isActive(href)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon
              className={`h-4 w-4 flex-shrink-0 transition-colors ${
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              }`}
            />
            {label}
            {isActive(href) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </nav>

      {/* ── Collapsible Bottom Accordion ── */}
      <div className="px-3 pb-4 border-t border-border/40">
        {/* Accordion Toggle Button */}
        <button
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
          aria-expanded={settingsOpen}
        >
          <Settings2 className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">Settings & Account</span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ${
              settingsOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {/* Accordion Panel — animates open/closed */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            settingsOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-1 space-y-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            {/* Help */}
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive("/dashboard")
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-background border-r border-border/60 z-50">
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b border-border/60 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src={APP_LOGO} alt="Ink Connect" className="h-8 w-8 rounded-md" />
          <span className="text-base font-bold">
            <span className="text-primary">Ink</span> Connect
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/client/new-request">
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Post Idea
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer Panel ── */}
      <div
        className={`md:hidden fixed top-0 left-0 h-screen w-72 bg-background border-r border-border/60 z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
}
