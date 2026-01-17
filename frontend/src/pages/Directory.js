import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STYLE_OPTIONS = [
  'Traditional', 'Neo-Traditional', 'Japanese', 'Blackwork', 
  'Realism', 'Watercolor', 'Tribal', 'Geometric', 'Fine Line',
  'Portraits', 'Cover-ups', 'Script'
];

const Directory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    style: searchParams.get('style') || '',
    price_range: searchParams.get('price_range') || '',
    min_rating: searchParams.get('min_rating') || '',
  });

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [searchParams]);

  const fetchFiltersData = async () => {
    try {
      const [citiesRes, statesRes] = await Promise.all([
        axios.get(`${API}/cities`),
        axios.get(`${API}/states`)
      ]);
      setCities(citiesRes.data);
      setStates(statesRes.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (value) params.append(key, value);
      });
      const response = await axios.get(`${API}/shops?${params.toString()}&limit=50`);
      setShops(response.data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      state: '',
      style: '',
      price_range: '',
      min_rating: '',
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 glow-text" data-testid="directory-title">SHOP DIRECTORY</h1>
          <p className="text-muted-foreground">Browse {shops.length} tattoo shops</p>
        </div>

        {/* Filters */}
        <div className="glass rounded p-6 mb-8" data-testid="filters-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <Input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="bg-black border-border"
                data-testid="filter-search"
              />
            </div>
            
            <Select value={filters.state} onValueChange={(value) => updateFilter('state', value)}>
              <SelectTrigger className="bg-black border-border" data-testid="filter-state">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.city} onValueChange={(value) => updateFilter('city', value)}>
              <SelectTrigger className="bg-black border-border" data-testid="filter-city">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.style} onValueChange={(value) => updateFilter('style', value)}>
              <SelectTrigger className="bg-black border-border" data-testid="filter-style">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.price_range} onValueChange={(value) => updateFilter('price_range', value)}>
              <SelectTrigger className="bg-black border-border" data-testid="filter-price">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ - Budget</SelectItem>
                <SelectItem value="$$">$$ - Moderate</SelectItem>
                <SelectItem value="$$$">$$$ - Premium</SelectItem>
                <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.min_rating} onValueChange={(value) => updateFilter('min_rating', value)}>
              <SelectTrigger className="bg-black border-border" data-testid="filter-rating">
                <SelectValue placeholder="Min Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={clearFilters}
            variant="ghost"
            className="mt-4 text-muted-foreground hover:text-white"
            data-testid="clear-filters-button"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        {/* Shop Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No shops found matching your filters</p>
            <Button onClick={clearFilters} variant="outline" className="border-primary/50 text-primary">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Link key={shop.id} to={`/shop/${shop.id}`} data-testid={`shop-card-${shop.id}`}>
                <div className="glass rounded hover:border-primary/50 transition-all duration-300 overflow-hidden group h-full">
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
                    <div className="flex items-center gap-2 mb-3">
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
                    <div className="flex flex-wrap gap-2">
                      {shop.styles.slice(0, 3).map((style, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-accent text-xs uppercase tracking-wider border border-border"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3">
                      <span className="font-mono text-sm text-primary">{shop.price_range}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Directory;