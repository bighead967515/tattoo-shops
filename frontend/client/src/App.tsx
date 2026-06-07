import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import HomeHeader from "./components/HomeHeader";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import ArtistBrowse from "./pages/ArtistBrowse";
import ArtistProfile from "./pages/ArtistProfile";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";


function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to + window.location.search);
  }, [to, setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* 5 Core Pages */}
      <Route path="/" component={Home} />
      <Route path="/artists" component={ArtistBrowse} />
      <Route path="/artist/:id" component={ArtistProfile} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Login} />
      <Route path="/dashboard" component={Dashboard} />

      {/* Supporting Auth routes */}
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />

      {/* Redirects for retired pages */}
      <Route path="/artist-finder"><Redirect to="/artists" /></Route>
      <Route path="/for-artists"><Redirect to="/" /></Route>
      <Route path="/cover-ups"><Redirect to="/" /></Route>
      <Route path="/tattoo-planning"><Redirect to="/" /></Route>
      <Route path="/request-flow"><Redirect to="/dashboard" /></Route>
      <Route path="/artist-dashboard"><Redirect to="/dashboard" /></Route>
      <Route path="/client/onboarding"><Redirect to="/dashboard" /></Route>
      <Route path="/client/dashboard"><Redirect to="/dashboard" /></Route>
      <Route path="/client/new-request"><Redirect to="/dashboard" /></Route>
      <Route path="/requests"><Redirect to="/dashboard" /></Route>
      <Route path="/requests/:id"><Redirect to="/dashboard" /></Route>
      <Route path="/client/design-lab"><Redirect to="/dashboard" /></Route>
      <Route path="/artist/register"><Redirect to="/dashboard" /></Route>
      <Route path="/artist/design-lab"><Redirect to="/dashboard" /></Route>
      <Route path="/artist/billing"><Redirect to="/dashboard" /></Route>
      <Route path="/artist/billing/success"><Redirect to="/dashboard" /></Route>
      <Route path="/admin"><Redirect to="/dashboard" /></Route>
      <Route path="/admin/moderation"><Redirect to="/dashboard" /></Route>
      <Route path="/help"><Redirect to="/" /></Route>
      <Route path="/pricing"><Redirect to="/" /></Route>
      <Route path="/cancellation-policy"><Redirect to="/" /></Route>
      <Route path="/terms-of-service"><Redirect to="/" /></Route>
      <Route path="/terms"><Redirect to="/" /></Route>
      <Route path="/privacy-policy"><Redirect to="/" /></Route>
      <Route path="/privacy"><Redirect to="/" /></Route>
      <Route path="/license-upload"><Redirect to="/dashboard" /></Route>

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route><Redirect to="/" /></Route>
    </Switch>
  );
}

function usesPageHeader(path: string) {
  return (
    path === "/artists" ||
    path.startsWith("/artist/") ||
    path === "/dashboard" ||
    path === "/404"
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [location] = useLocation();
  const showMarketingHomeHeader = location === "/";
  const showSidebarShell = !showMarketingHomeHeader && !usesPageHeader(location);

  const { user } = useAuth();
  const trackInviteOpenMutation = trpc.artists.trackInviteOpen.useMutation();
  const linkInviteCodeMutation = trpc.artists.linkInviteCode.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) {
      localStorage.setItem("artist_invite_code", invite);
      const trackedKey = `invite_tracked_${invite}`;
      if (!sessionStorage.getItem(trackedKey)) {
        trackInviteOpenMutation.mutate({ inviteCode: invite }, {
          onSuccess: () => {
            sessionStorage.setItem(trackedKey, "true");
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const inviteCode = localStorage.getItem("artist_invite_code");
      if (inviteCode) {
        linkInviteCodeMutation.mutate({ inviteCode }, {
          onSuccess: () => {
            localStorage.removeItem("artist_invite_code");
          }
        });
      }
    }
  }, [user]);

  useEffect(() => {
    const win = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
      __inkLastTrackedPath?: string;
    };

    if (win.__inkLastTrackedPath === location) {
      return;
    }
    win.__inkLastTrackedPath = location;

    // Keep analytics vendor-agnostic while still supporting GA if present.
    win.dataLayer?.push({
      event: "page_view",
      page_path: location,
      page_title: document.title,
    });

    if (typeof win.gtag === "function") {
      win.gtag("event", "page_view", {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          {showMarketingHomeHeader && <HomeHeader />}
          {showSidebarShell && <Sidebar />}
          <main
            className={
              showSidebarShell
                ? "md:ml-60 pt-14 md:pt-0 min-h-screen"
                : "min-h-screen"
            }
          >
            <Router />
          </main>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
