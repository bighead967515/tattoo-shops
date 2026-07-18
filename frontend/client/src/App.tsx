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
import ForArtists from "./pages/ForArtists";
import Pricing from "./pages/Pricing";
import Help from "./pages/Help";
import CancellationPolicy from "./pages/CancellationPolicy";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ArtistRegister from "./pages/ArtistRegister";
import NewRequest from "./pages/NewRequest";
import RequestBoard from "./pages/RequestBoard";
import RequestDetail from "./pages/RequestDetail";
import ClientDashboard from "./pages/ClientDashboard";
import DesignLab from "./pages/DesignLab";
import ArtistDesignLab from "./pages/ArtistDesignLab";
import ArtistBilling from "./pages/ArtistBilling";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import LicenseUpload from "./pages/LicenseUpload";
import ArtistSignupLanding from "./pages/ArtistSignupLanding";
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
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Login} />
      <Route path="/dashboard" component={Dashboard} />

      {/* Informational Pages */}
      <Route path="/for-artists" component={ForArtists} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/help" component={Help} />
      <Route path="/cancellation-policy" component={CancellationPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />

      {/* Active Feature Pages */}
      <Route path="/artist/register"><Redirect to="/artist/signup" /></Route>
      <Route path="/artist/signup" component={ArtistSignupLanding} />
      <Route path="/client/new-request" component={NewRequest} />
      <Route path="/requests" component={RequestBoard} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/design-lab" component={DesignLab} />
      <Route path="/artist/design-lab" component={ArtistDesignLab} />
      <Route path="/artist/billing" component={ArtistBilling} />
      <Route path="/artist/billing/success" component={SubscriptionSuccess} />
      <Route path="/artist/:id" component={ArtistProfile} />
      <Route path="/license-upload" component={LicenseUpload} />

      {/* Supporting Auth routes */}
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />

      {/* Artist dashboard convenience routes */}
      <Route path="/artist/dashboard"><Redirect to="/dashboard" /></Route>
      <Route path="/artist/manage"><Redirect to="/dashboard" /></Route>

      {/* Redirects for retired pages */}
      <Route path="/artist-finder"><Redirect to="/artists" /></Route>
      <Route path="/cover-ups"><Redirect to="/" /></Route>
      <Route path="/tattoo-planning"><Redirect to="/" /></Route>
      <Route path="/request-flow"><Redirect to="/dashboard" /></Route>
      <Route path="/artist-dashboard"><Redirect to="/dashboard" /></Route>
      <Route path="/client/onboarding"><Redirect to="/dashboard" /></Route>
      <Route path="/admin"><Redirect to="/dashboard" /></Route>
      <Route path="/admin/moderation"><Redirect to="/dashboard" /></Route>
      <Route path="/terms"><Redirect to="/terms-of-service" /></Route>
      <Route path="/privacy"><Redirect to="/privacy-policy" /></Route>

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route><Redirect to="/" /></Route>
    </Switch>
  );
}

function usesPageHeader(path: string) {
  const customPages = [
    "/artists",
    "/dashboard",
    "/404",
    "/for-artists",
    "/pricing",
    "/help",
    "/cancellation-policy",
    "/terms-of-service",
    "/privacy-policy",
    "/client/design-lab",
  ];
  return (
    customPages.includes(path) ||
    path.startsWith("/artist/")
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
    // Update canonical URL on every route change
    const BASE = "https://inkedconnect.com";
    let canonical = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    // Strip query strings and hash from canonical; dynamic pages use their own path
    canonical.href = BASE + location.split("?")[0].split("#")[0];

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
