import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const ArtistRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Find Shop, 2: Create Account
  const [loading, setLoading] = useState(false);
  
  // Shop search
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  
  // Registration form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const searchShops = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a shop name or city');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/shops?search=${encodeURIComponent(searchQuery)}&limit=20`);
      setShops(response.data);
      if (response.data.length === 0) {
        toast.error('No shops found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search shops');
    } finally {
      setLoading(false);
    }
  };

  const selectShop = (shop) => {
    setSelectedShop(shop);
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/artists/register`, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        shop_id: selectedShop.id
      });
      
      localStorage.setItem('artist_token', response.data.token);
      localStorage.setItem('artist', JSON.stringify(response.data.artist));
      toast.success('Registration successful! Welcome to InkFinder.');
      navigate('/artist/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="px-4 md:px-8 py-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 glow-text" data-testid="register-title">
            ARTIST ONBOARDING
          </h1>
          <p className="text-muted-foreground text-lg">
            Join InkFinder and manage your tattoo shop profile
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary/20' : 'border-border'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="font-bold hidden sm:inline">Find Your Shop</span>
          </div>
          <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary/20' : 'border-border'}`}>
              2
            </div>
            <span className="font-bold hidden sm:inline">Create Account</span>
          </div>
        </div>

        {/* Step 1: Find Shop */}
        {step === 1 && (
          <div className="glass rounded p-8">
            <h2 className="text-2xl font-bold mb-6 text-primary">Find Your Tattoo Shop</h2>
            <p className="text-muted-foreground mb-6">
              Search for your shop by name or city. If your shop isn't listed, contact support.
            </p>
            
            <div className="flex gap-3 mb-6">
              <Input
                type="text"
                placeholder="Search by shop name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchShops()}
                className="bg-black border-border flex-1"
                data-testid="shop-search-input"
              />
              <Button
                onClick={searchShops}
                disabled={loading}
                className="bg-primary text-black font-bold"
                data-testid="search-shop-button"
              >
                <Search className="w-5 h-5 mr-2" />
                {loading ? 'SEARCHING...' : 'SEARCH'}
              </Button>
            </div>

            {shops.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                  Select Your Shop ({shops.length} found)
                </h3>
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => selectShop(shop)}
                    className="glass rounded p-4 hover:border-primary/50 cursor-pointer transition-all group"
                    data-testid={`shop-option-${shop.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-primary group-hover:text-primary/80">
                          {shop.shop_name}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {shop.address || `${shop.city}, ${shop.state} ${shop.zip}`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {shop.styles.slice(0, 3).map((style, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-accent text-xs uppercase border border-border"
                            >
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" className="border-primary text-primary">
                        SELECT
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {shops.length === 0 && searchQuery && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">No shops found matching "{searchQuery}"</p>
                <p className="text-sm">Try searching by shop name or city</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && selectedShop && (
          <div className="glass rounded p-8">
            <h2 className="text-2xl font-bold mb-2 text-primary">Create Your Artist Account</h2>
            <p className="text-muted-foreground mb-6">
              Claiming: <span className="text-primary font-bold">{selectedShop.shop_name}</span>
            </p>
            
            <Button
              onClick={() => setStep(1)}
              variant="ghost"
              className="mb-6 text-muted-foreground"
            >
              ← Change Shop
            </Button>

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Your Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                  className="bg-black border-border"
                  data-testid="artist-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                  className="bg-black border-border"
                  data-testid="artist-email-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use your business email for verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Password *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="bg-black border-border"
                  data-testid="artist-password-input"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Confirm Password *</label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter your password"
                  required
                  className="bg-black border-border"
                  data-testid="artist-confirm-password-input"
                />
              </div>

              <div className="bg-accent border border-border rounded p-4">
                <h4 className="font-bold text-sm mb-2 text-primary">What You'll Get:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full control over your shop's profile and description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Update specialties, styles, and pricing information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Respond to reviews and engage with clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Gain visibility in featured artist sections</span>
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-bold h-12"
                data-testid="register-submit-button"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/artist/login" className="text-primary hover:text-primary/80">
                Login here
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistRegister;
