import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ArtistLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/artists/login`, { email, password });
      localStorage.setItem('artist_token', response.data.token);
      localStorage.setItem('artist', JSON.stringify(response.data.artist));
      toast.success('Login successful!');
      navigate('/artist/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="glass rounded max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 glow-text" data-testid="login-title">ARTIST LOGIN</h1>
            <p className="text-muted-foreground">Manage your tattoo shop profile</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-black border-border"
                data-testid="email-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-black border-border"
                data-testid="password-input"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold"
              data-testid="login-button"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don't have an account? Contact support to register your shop.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistLogin;