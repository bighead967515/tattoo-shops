import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Search } from "lucide-react";
import { useLocation } from "wouter";
import Header from "@/components/Header";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container flex items-center justify-center py-20">
        <Card className="w-full max-w-lg p-12 text-center">
          <div className="text-9xl font-bold text-primary mb-4">404</div>
          
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          
          <p className="text-muted-foreground mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/")}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/artists")}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Artists
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
