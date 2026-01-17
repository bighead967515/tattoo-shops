import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const isArtist = localStorage.getItem('artist_token');

  return (
    <nav className="backdrop-blur-xl bg-black/70 border-b border-white/10 sticky top-0 z-50" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <h2 className="text-2xl font-bold font-heading text-primary glow-text">INK<span className="text-secondary">FINDER</span></h2>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/" data-testid="nav-home">
              <Button
                variant="ghost"
                className={`hover:text-white ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Home className="w-5 h-5 mr-2" />
                HOME
              </Button>
            </Link>
            
            <Link to="/directory" data-testid="nav-directory">
              <Button
                variant="ghost"
                className={`hover:text-white ${location.pathname === '/directory' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Compass className="w-5 h-5 mr-2" />
                DIRECTORY
              </Button>
            </Link>
            
            <Link to="/favorites" data-testid="nav-favorites">
              <Button
                variant="ghost"
                className={`hover:text-white ${location.pathname === '/favorites' ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Heart className="w-5 h-5 mr-2" />
                FAVORITES
              </Button>
            </Link>
            
            {isArtist ? (
              <Link to="/artist/dashboard" data-testid="nav-dashboard">
                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <User className="w-5 h-5 mr-2" />
                  DASHBOARD
                </Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link to="/artist/login" data-testid="nav-artist-login">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-white"
                  >
                    LOGIN
                  </Button>
                </Link>
                <Link to="/artist/register" data-testid="nav-artist-register">
                  <Button
                    variant="outline"
                    className="border-primary/50 text-primary hover:bg-primary/10"
                  >
                    <User className="w-5 h-5 mr-2" />
                    ARTIST SIGNUP
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;