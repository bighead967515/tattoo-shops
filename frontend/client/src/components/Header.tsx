import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  Moon,
  Sun,
  X,
  PenLine,
  Search,
  Users,
  Compass,
  Palette,
  LayoutDashboard,
  LogOut,
  ClipboardList,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Search },
  { href: "/artists", label: "Browse Artists", icon: Users },
  { href: "/artist-finder", label: "Artist Finder", icon: Compass },
  { href: "/requests", label: "Request Board", icon: ClipboardList },
  { href: "/for-artists", label: "For Artists", icon: Palette },
];

export default function Header() {
  const [location] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const close = () => setMobileOpen(false);

  const sidebarInner = (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <Link
        href="/"
        onClick={close}
        className="flex items-center gap-3 mb-8 px-2"
      >
        <img src={APP_LOGO} alt="Universal Inc" className="h-10 w-10 rounded-lg" />
        <span className="text-lg font-bold text-white">Universal Inc</span>
      </Link>

      {/* Primary CTA */}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Link href="/client/new-request" onClick={close} className="mb-6">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(112,255,112,0.35)] hover:shadow-[0_0_25px_rgba(112,255,112,0.65)] transition-all duration-300">
              <PenLine className="w-4 h-4 mr-2" />
              Post an Idea
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Describe your tattoo idea and receive bids from artists
        </TooltipContent>
      </Tooltip>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Tooltip key={href} delayDuration={200}>
            <TooltipTrigger asChild>
              <Link
                href={href}
                onClick={close}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location === href
                    ? "bg-primary/20 text-primary"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 mr-2" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>

        {isAuthenticated ? (
          <>
            <Link href="/dashboard" onClick={close}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Signing Out…" : "Sign Out"}
            </Button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={close}>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/login" onClick={close}>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                Sign Up Free
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixed left) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-slate-900 border-r border-white/10 z-50">
        {sidebarInner}
      </aside>

      {/* ── Mobile: hamburger button ── */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 border border-white/10 text-white shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile: sidebar drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          {/* Drawer */}
          <aside className="relative w-64 h-full bg-slate-900 border-r border-white/10 flex flex-col">
            <button
              className="absolute top-4 right-4 p-1 text-slate-300 hover:text-white"
              onClick={close}
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}
    </>
  );
}
