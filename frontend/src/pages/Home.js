import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredShops, setFeaturedShops] = useState([]);

  useEffect(() => {
    fetchFeaturedShops();
  }, []);

  const fetchFeaturedShops = async () => {
    try {
      const response = await axios.get(`${API}/featured-shops?limit=6`);
      setFeaturedShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/directory');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1561411996-3794338f63cc?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative z-10 px-4 md:px-8 max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 glow-text" data-testid="hero-title">
            FIND YOUR
            <span className="text-primary block mt-2">TATTOO ARTIST</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Discover the best tattoo shops. Read real reviews. Avoid the worst.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative glass rounded-sm p-2 neon-border" data-testid="search-container">
              <div className="flex items-center gap-2">
                <Search className="text-primary w-6 h-6 ml-2" />
                <Input
                  type="text"
                  placeholder="Search by shop name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder:text-muted-foreground/50"
                  data-testid="search-input"
                />
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider px-8 h-12"
                  data-testid="search-button"
                >
                  SEARCH
                </Button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-center gap-6 mt-8">
            <Link to="/directory" data-testid="browse-all-link">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                <Filter className="w-4 h-4 mr-2" />
                BROWSE ALL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Shops */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold mb-4 glow-text-purple" data-testid="featured-title">
              FEATURED ARTISTS
            </h2>
            <p className="text-muted-foreground text-lg">
              Top-rated tattoo shops and artists recommended by the community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredShops.map((shop) => (
              <Link key={shop.id} to={`/shop/${shop.id}`} data-testid={`shop-card-${shop.id}`}>
                <div className="glass rounded hover:border-primary/50 transition-all duration-300 overflow-hidden group relative">
                  {shop.avg_rating >= 4.0 && shop.review_count > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-primary text-black px-3 py-1 rounded-sm font-bold text-xs uppercase tracking-wider">
                      TOP RATED
                    </div>
                  )}
                  <div className="aspect-video bg-accent relative overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1655948433975-ef1d50f4f82c?crop=entropy&cs=srgb&fm=jpg&q=85"
                      alt={shop.shop_name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-primary" data-testid={`shop-name-${shop.id}`}>
                      {shop.shop_name}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{shop.city}, {shop.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(shop.avg_rating)
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-sm text-muted-foreground">
                        {shop.avg_rating > 0 ? `${shop.avg_rating.toFixed(1)} (${shop.review_count})` : 'New'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {shop.styles.slice(0, 2).map((style, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-accent text-xs uppercase tracking-wider border border-border"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;