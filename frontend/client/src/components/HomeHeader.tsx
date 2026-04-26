import { useState } from "react";
import { Link } from "wouter";
import { APP_LOGO } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navLinks = [
  { href: "/artists", label: "Browse Artists" },
  { href: "/#how-it-works", label: "How It Works", isAnchor: true },
  { href: "/for-artists", label: "For Artists" },
];

export default function HomeHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, logout } = useAuth();

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <img src={APP_LOGO} alt="Ink Connect" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Ink Connect
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label, isAnchor }) =>
            isAnchor ? (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login?mode=signup">
                <Button>Sign Up Free</Button>
              </Link>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[22rem] border-l border-border/60 px-0">
            <SheetHeader className="border-b border-border/60 px-6 pb-5">
              <SheetTitle className="text-left text-lg">Ink Connect</SheetTitle>
              <SheetDescription className="text-left">
                Browse artists, post your idea, or join as an artist.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-2 px-4 py-6">
              {navLinks.map(({ href, label, isAnchor }) =>
                isAnchor ? (
                  <SheetClose asChild key={href}>
                    <a
                      href={href}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {label}
                    </a>
                  </SheetClose>
                ) : (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ),
              )}
            </div>

            <div className="mt-auto border-t border-border/60 px-4 py-6">
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                  </SheetClose>
                  <Button onClick={handleLogout} disabled={isLoggingOut} className="w-full">
                    {isLoggingOut ? "Signing Out..." : "Sign Out"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/login?mode=signup">
                      <Button className="w-full">Sign Up Free</Button>
                    </Link>
                  </SheetClose>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}