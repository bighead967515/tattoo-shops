import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import ArtistFinder from "./pages/ArtistFinder";
import ArtistBrowse from "./pages/ArtistBrowse";
import ArtistProfile from "./pages/ArtistProfile";
import ForArtists from "./pages/ForArtists";
import Dashboard from "./pages/Dashboard";
import ArtistDashboard from "./pages/ArtistDashboard";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Help from "./pages/Help";
import CancellationPolicy from "./pages/CancellationPolicy";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Pricing from "./pages/Pricing";
import LicenseUpload from "./pages/LicenseUpload";
// Client marketplace pages
import ClientOnboarding from "./pages/ClientOnboarding";
import ClientDashboard from "./pages/ClientDashboard";
import NewRequest from "./pages/NewRequest";
import RequestBoard from "./pages/RequestBoard";
import RequestDetail from "./pages/RequestDetail";
import AdminModeration from "./pages/AdminModeration";
import DesignLab from "./pages/DesignLab";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ArtistBilling from "./pages/ArtistBilling";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/artist-finder" component={ArtistFinder} />
      <Route path="/artists" component={ArtistBrowse} />
      <Route path="/artist/:id" component={ArtistProfile} />
      <Route path="/for-artists" component={ForArtists} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/artist-dashboard" component={ArtistDashboard} />
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/help" component={Help} />
      <Route path="/cancellation-policy" component={CancellationPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      {/* Alias routes for footer links */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/license-upload" component={LicenseUpload} />
      {/* Client marketplace routes */}
      <Route path="/client/onboarding" component={ClientOnboarding} />
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/new-request" component={NewRequest} />
      <Route path="/requests" component={RequestBoard} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/client/design-lab" component={DesignLab} />
      {/* Artist billing routes */}
      <Route path="/artist/billing" component={ArtistBilling} />
      <Route path="/artist/billing/success" component={SubscriptionSuccess} />
      {/* Admin routes */}
      <Route path="/admin/moderation" component={AdminModeration} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          {/* Fixed left sidebar (desktop) / top bar + drawer (mobile) */}
          <Sidebar />
          {/* Main content area — offset by sidebar width on desktop, top bar height on mobile */}
          <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">
            <Router />
          </main>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
