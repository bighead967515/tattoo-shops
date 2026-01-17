import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Heart, Share2, Phone, Mail, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const ShopDetail = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    rating: 0,
    comment: '',
    images: []
  });

  useEffect(() => {
    fetchShopData();
    checkIfFavorite();
  }, [id]);

  const fetchShopData = async () => {
    try {
      const [shopRes, reviewsRes] = await Promise.all([
        axios.get(`${API}/shops/${id}`),
        axios.get(`${API}/shops/${id}/reviews`)
      ]);
      setShop(shopRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching shop:', error);
      toast.error('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav !== id);
      toast.success('Removed from favorites');
    } else {
      newFavorites = [...favorites, id];
      toast.success('Added to favorites');
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const shareShop = () => {
    if (navigator.share) {
      navigator.share({
        title: shop.shop_name,
        text: `Check out ${shop.shop_name} - a tattoo shop in ${shop.city}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + reviewForm.images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/upload`, formData);
        return response.data.image_url;
      });
      
      const imageUrls = await Promise.all(uploadPromises);
      setReviewForm(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      toast.success('Images uploaded');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };

  const removeImage = (index) => {
    setReviewForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const submitReview = async () => {
    if (!reviewForm.reviewer_name || !reviewForm.rating || !reviewForm.comment) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await axios.post(`${API}/reviews`, {
        ...reviewForm,
        shop_id: id
      });
      toast.success('Review submitted!');
      setShowReviewDialog(false);
      setReviewForm({ reviewer_name: '', rating: 0, comment: '', images: [] });
      fetchShopData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
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

  if (!shop) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Shop not found</h2>
            <Link to="/directory">
              <Button>Back to Directory</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="glass rounded overflow-hidden mb-8">
          <div className="h-[400px] bg-accent relative">
            <img
              src="https://images.unsplash.com/photo-1744946174053-2ced46e0c3d9?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt={shop.shop_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
          
          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 glow-text" data-testid="shop-name">{shop.shop_name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="w-5 h-5" />
                  <span>{shop.address || `${shop.city}, ${shop.state} ${shop.zip}`}</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(shop.avg_rating)
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-lg">
                    {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : 'No ratings yet'} ({shop.review_count} reviews)
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={toggleFavorite}
                  variant={isFavorite ? 'default' : 'outline'}
                  className={isFavorite ? 'bg-primary text-black' : 'border-primary/50 text-primary'}
                  data-testid="favorite-button"
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'SAVED' : 'SAVE'}
                </Button>
                <Button
                  onClick={shareShop}
                  variant="outline"
                  className="border-primary/50 text-primary"
                  data-testid="share-button"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  SHARE
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {shop.styles.map((style, idx) => (
                    <span key={idx} className="px-3 py-2 bg-accent border border-border uppercase text-sm">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Price Range</h3>
                <span className="font-mono text-2xl text-primary">{shop.price_range}</span>
              </div>
            </div>
            
            {shop.phone && (
              <div className="flex items-center gap-3 mb-3">
                <Phone className="w-5 h-5 text-primary" />
                <a href={`tel:${shop.phone}`} className="text-foreground hover:text-primary">
                  {shop.phone}
                </a>
              </div>
            )}
            
            {shop.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <a href={`mailto:${shop.email}`} className="text-foreground hover:text-primary">
                  {shop.email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold glow-text-purple">REVIEWS ({reviews.length})</h2>
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-black font-bold" data-testid="write-review-button">
                  WRITE A REVIEW
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-primary">Write a Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Your Name *</label>
                    <Input
                      value={reviewForm.reviewer_name}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, reviewer_name: e.target.value }))}
                      placeholder="Enter your name"
                      className="bg-black border-border"
                      data-testid="reviewer-name-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-2">Rating *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                          className="transition-transform hover:scale-110"
                          data-testid={`rating-star-${rating}`}
                        >
                          <Star
                            className={`w-8 h-8 ${
                              rating <= reviewForm.rating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-2">Your Review *</label>
                    <Textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience..."
                      rows={5}
                      className="bg-black border-border"
                      data-testid="review-comment-textarea"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-2">Photos (Optional)</label>
                    <div className="flex flex-wrap gap-4">
                      {reviewForm.images.map((img, idx) => (
                        <div key={idx} className="image-preview relative">
                          <img src={img} alt={`Upload ${idx + 1}`} className="w-24 h-24 object-cover" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="remove-image"
                            data-testid={`remove-image-${idx}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {reviewForm.images.length < 5 && (
                        <label className="w-24 h-24 border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            data-testid="upload-image-input"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={submitReview}
                    className="w-full bg-primary text-black font-bold"
                    data-testid="submit-review-button"
                  >
                    SUBMIT REVIEW
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="glass rounded p-12 text-center">
                <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review!</p>
                <Button onClick={() => setShowReviewDialog(true)} className="bg-primary text-black">
                  WRITE FIRST REVIEW
                </Button>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="glass rounded p-6" data-testid={`review-${review.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-primary">{review.reviewer_name}</h4>
                      <span className="text-sm text-muted-foreground font-mono">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-foreground mb-4">{review.comment}</p>
                  {review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review ${idx + 1}`}
                          className="w-24 h-24 object-cover rounded border border-primary/30"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetail;