import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const Favorites = () => {
  const [favoriteShops, setFavoriteShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (favoriteIds.length === 0) {
        setLoading(false);
        return;
      }

      const shopPromises = favoriteIds.map(id => 
        axios.get(`${API}/shops/${id}`).catch(() => null)
      );
      const shops = (await Promise.all(shopPromises)).filter(res => res !== null).map(res => res.data);
      setFavoriteShops(shops);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (shopId) => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = favorites.filter(id => id !== shopId);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setFavoriteShops(prev => prev.filter(shop => shop.id !== shopId));
    toast.success('Removed from favorites');
  };

  const shareFavorites = () => {
    const favoriteIds = favoriteShops.map(s => s.id).join(',');
    const shareUrl = `${window.location.origin}/favorites?ids=${favoriteIds}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Favorite Tattoo Shops',
        text: 'Check out my favorite tattoo shops!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 glow-text" data-testid="favorites-title">MY FAVORITES</h1>
            <p className="text-muted-foreground">{favoriteShops.length} saved shops</p>
          </div>
          {favoriteShops.length > 0 && (
            <Button
              onClick={shareFavorites}
              variant="outline"
              className="border-primary/50 text-primary"
              data-testid="share-favorites-button"
            >
              <Share2 className="w-5 h-5 mr-2" />
              SHARE FAVORITES
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading favorites...</div>
        ) : favoriteShops.length === 0 ? (
          <div className="glass rounded p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2 text-primary">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">Start exploring and save your favorite tattoo shops!</p>
            <Link to="/directory">
              <Button className="bg-primary text-black" data-testid="browse-shops-button">BROWSE SHOPS</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteShops.map((shop) => (
              <div key={shop.id} className="glass rounded overflow-hidden" data-testid={`favorite-shop-${shop.id}`}>
                <Link to={`/shop/${shop.id}`}>
                  <div className="aspect-video bg-accent relative overflow-hidden group">
                    <img
                      src="https://images.unsplash.com/photo-1655948433975-ef1d50f4f82c?crop=entropy&cs=srgb&fm=jpg&q=85"
                      alt={shop.shop_name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                </Link>
                <div className="p-6">
                  <Link to={`/shop/${shop.id}`}>
                    <h3 className="text-xl font-bold mb-2 text-primary hover:text-primary/80 transition-colors">
                      {shop.shop_name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{shop.city}, {shop.state}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
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
                      {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : 'New'} ({shop.review_count})
                    </span>
                  </div>
                  <Button
                    onClick={() => removeFavorite(shop.id)}
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white"
                    data-testid={`remove-favorite-${shop.id}`}
                  >
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    REMOVE
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;