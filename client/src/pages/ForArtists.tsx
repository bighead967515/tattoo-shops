import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Users, Calendar, TrendingUp, MapPin } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function ForArtists() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const createArtistMutation = trpc.artists.create.useMutation();
  
  const [formData, setFormData] = useState({
    artistName: "",
    shopName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Louisiana",
    zipCode: "",
    website: "",
    instagram: "",
    specialties: "",
    experience: "",
    portfolio: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to register as an artist");
      window.location.href = getLoginUrl();
      return;
    }
    
    try {
      await createArtistMutation.mutateAsync({
        shopName: formData.shopName,
        bio: formData.bio,
        specialties: formData.specialties,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phone: formData.phone,
        website: formData.website,
        instagram: formData.instagram,
      });
      
      toast.success("Application submitted successfully! We'll review your information and get back to you within 2-3 business days.");
      
      // Reset form
      setFormData({
        artistName: "",
        shopName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "Louisiana",
        zipCode: "",
        website: "",
        instagram: "",
        specialties: "",
        experience: "",
        portfolio: "",
        bio: "",
      });
      
      // Redirect to dashboard after successful submission
      setTimeout(() => setLocation("/dashboard"), 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-card">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              Join Universal Inc
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect with thousands of clients looking for talented tattoo artists like you
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Why Join Our Platform?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-background border-border text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Reach More Clients</h3>
                <p className="text-sm text-muted-foreground">
                  Get discovered by people actively searching for tattoo artists in your area
                </p>
              </Card>

              <Card className="p-6 bg-background border-border text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Easy Booking</h3>
                <p className="text-sm text-muted-foreground">
                  Manage appointments and bookings directly through our platform
                </p>
              </Card>

              <Card className="p-6 bg-background border-border text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Grow Your Business</h3>
                <p className="text-sm text-muted-foreground">
                  Build your reputation with reviews and showcase your portfolio
                </p>
              </Card>

              <Card className="p-6 bg-background border-border text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Local Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  Appear on our interactive map and location-based searches
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Register Your Studio
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below to get started. We'll review your application and contact you within 2-3 business days.
              </p>
            </div>

            <Card className="p-8 bg-card border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Basic Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistName">Artist/Owner Name *</Label>
                      <Input
                        id="artistName"
                        name="artistName"
                        value={formData.artistName}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shopName">Shop Name *</Label>
                      <Input
                        id="shopName"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Location</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        required
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Online Presence</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        placeholder="https://"
                        value={formData.website}
                        onChange={handleChange}
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram Handle</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        placeholder="@yourusername"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Professional Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialties">Specialties *</Label>
                    <Input
                      id="specialties"
                      name="specialties"
                      placeholder="e.g., Realism, Traditional, Japanese, Geometric"
                      value={formData.specialties}
                      onChange={handleChange}
                      required
                      className="bg-background border-border"
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple specialties with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={handleChange}
                      required
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      name="portfolio"
                      type="url"
                      placeholder="https://"
                      value={formData.portfolio}
                      onChange={handleChange}
                      className="bg-background border-border"
                    />
                    <p className="text-xs text-muted-foreground">Link to your online portfolio or gallery</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">About You/Your Shop *</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      rows={5}
                      placeholder="Tell us about your artistic style, experience, and what makes your shop unique..."
                      value={formData.bio}
                      onChange={handleChange}
                      required
                      className="bg-background border-border resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">What happens next?</p>
                    <p className="text-muted-foreground">
                      Our team will review your application within 2-3 business days. Once approved, 
                      you'll receive login credentials and instructions to set up your profile and start accepting bookings.
                    </p>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit Application
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Universal Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
