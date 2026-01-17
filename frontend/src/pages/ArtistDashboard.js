import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STYLE_OPTIONS = [
  'Traditional', 'Neo-Traditional', 'Japanese', 'Blackwork', 
  'Realism', 'Watercolor', 'Tribal', 'Geometric', 'Fine Line',
  'Portraits', 'Cover-ups', 'Script'
];

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    styles: [],
    price_range: '$$'
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('artist_token');
    if (!token) {
      navigate('/artist/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [artistRes, shopRes] = await Promise.all([
        axios.get(`${API}/artists/me`, config),
        axios.get(`${API}/artists/shop`, config)
      ]);
      
      setArtist(artistRes.data);
      setShop(shopRes.data);
      setEditForm({
        description: shopRes.data.description || '',
        styles: shopRes.data.styles || [],
        price_range: shopRes.data.price_range || '$$'
      });
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Session expired. Please login again.');
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('artist_token');
    localStorage.removeItem('artist');
    navigate('/artist/login');
  };

  const toggleStyle = (style) => {
    setEditForm(prev => {
      const styles = prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style];
      return { ...prev, styles };
    });
  };

  const saveChanges = async () => {
    const token = localStorage.getItem('artist_token');
    try {
      const response = await axios.put(
        `${API}/shops/${shop.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShop(response.data);
      setEditing(false);
      toast.success('Shop updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update shop');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold glow-text" data-testid="dashboard-title">ARTIST DASHBOARD</h1>
            <p className="text-muted-foreground mt-2">Welcome back, {artist?.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-destructive text-destructive" data-testid="logout-button">
            <LogOut className="w-4 h-4 mr-2" />
            LOGOUT
          </Button>
        </div>

        {shop && (
          <div className="glass rounded p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">{shop.shop_name}</h2>
              <div className="flex gap-3">
                <Link to={`/shop/${shop.id}`}>
                  <Button variant="outline" className="border-primary/50 text-primary" data-testid="view-public-button">
                    VIEW PUBLIC PAGE
                  </Button>
                </Link>
                {!editing ? (
                  <Button onClick={() => setEditing(true)} className="bg-primary text-black" data-testid="edit-button">
                    <Edit className="w-4 h-4 mr-2" />
                    EDIT
                  </Button>
                ) : (
                  <Button onClick={saveChanges} className="bg-primary text-black" data-testid="save-button">
                    <Save className="w-4 h-4 mr-2" />
                    SAVE
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                  Location
                </label>
                <p className="text-foreground">{shop.address || `${shop.city}, ${shop.state} ${shop.zip}`}</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                  Contact
                </label>
                <p className="text-foreground">{shop.phone}</p>
                <p className="text-foreground">{shop.email}</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                {editing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your shop, specialties, and experience..."
                    rows={5}
                    className="bg-black border-border"
                    data-testid="description-textarea"
                  />
                ) : (
                  <p className="text-foreground">{shop.description || 'No description yet. Click Edit to add one.'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                  Specialties
                </label>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className={`px-3 py-2 border uppercase text-sm transition-colors ${
                          editForm.styles.includes(style)
                            ? 'bg-primary text-black border-primary'
                            : 'bg-accent border-border text-foreground hover:border-primary/50'
                        }`}
                        data-testid={`style-${style}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {shop.styles.map((style, idx) => (
                      <span key={idx} className="px-3 py-2 bg-accent border border-border uppercase text-sm">
                        {style}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                  Price Range
                </label>
                {editing ? (
                  <Select value={editForm.price_range} onValueChange={(value) => setEditForm(prev => ({ ...prev, price_range: value }))}>
                    <SelectTrigger className="bg-black border-border w-48" data-testid="price-range-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ - Budget</SelectItem>
                      <SelectItem value="$$">$$ - Moderate</SelectItem>
                      <SelectItem value="$$$">$$$ - Premium</SelectItem>
                      <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="font-mono text-2xl text-primary">{shop.price_range}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-muted-foreground">
                  Rating & Reviews
                </label>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-2xl text-primary">
                    {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : 'No ratings'}
                  </span>
                  <span className="text-muted-foreground">({shop.review_count} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistDashboard;