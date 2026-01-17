import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, MessageCircle, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const faqs = [
  {
    category: "Booking",
    questions: [
      {
        q: "How do I book an appointment?",
        a: "Browse artists, select your preferred artist, click 'Book Now', choose a date and time, and complete the $50 deposit payment to secure your appointment."
      },
      {
        q: "What is the booking deposit for?",
        a: "The $50 deposit secures your appointment slot and is deducted from your final tattoo cost. It shows commitment and helps artists manage their schedule."
      },
      {
        q: "Can I reschedule my appointment?",
        a: "Yes! You can reschedule up to 48 hours before your appointment at no charge. Contact your artist directly or use your dashboard to request a reschedule."
      },
      {
        q: "What happens if I need to cancel?",
        a: "Cancellations made 48+ hours in advance receive a full refund. Cancellations within 48 hours forfeit the deposit. See our cancellation policy for details."
      }
    ]
  },
  {
    category: "Payments",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets through our secure Stripe payment system."
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. All payments are processed through Stripe with SSL encryption and PCI compliance. We never store your full card details on our servers."
      },
      {
        q: "When do I pay the remaining balance?",
        a: "The remaining balance is paid directly to the artist at your appointment. Payment methods accepted vary by artist (cash, card, etc.)."
      },
      {
        q: "Can I get a refund?",
        a: "Deposits are refundable if cancelled 48+ hours in advance. For other refund requests, please contact support with your booking details."
      }
    ]
  },
  {
    category: "Artists",
    questions: [
      {
        q: "Are all artists verified?",
        a: "Yes! Every artist on our platform is verified through background checks, portfolio reviews, and license verification to ensure quality and safety."
      },
      {
        q: "How do I become an artist on the platform?",
        a: "Visit our 'For Artists' page and complete the registration form. We'll review your portfolio, verify your credentials, and onboard you within 5-7 business days."
      },
      {
        q: "Can I request a specific artist?",
        a: "Yes! Browse artist profiles, view their portfolios and availability, then book directly with your preferred artist."
      },
      {
        q: "What if I'm not satisfied with my tattoo?",
        a: "Contact the artist first to discuss touch-ups or concerns. If unresolved, reach out to our support team for mediation assistance."
      }
    ]
  },
  {
    category: "Account",
    questions: [
      {
        q: "Do I need an account to book?",
        a: "Yes, an account is required to book appointments, save favorite artists, leave reviews, and manage your booking history."
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Sign In', then 'Forgot Password'. Enter your email and we'll send you a password reset link."
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Dashboard > Settings > Account and select 'Delete Account'. Note: This action is permanent and cannot be undone."
      }
    ]
  }
];

export default function Help() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          faq =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll respond within 24 hours.");
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background to-primary/5 border-b">
        <div className="container py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How Can We Help?</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find answers to common questions or contact our support team
            </p>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with our support team
            </p>
            <Button variant="outline" size="sm" onClick={() => toast.info("Live chat coming soon!")}>
              Start Chat
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              support@universalinc.com
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "mailto:support@universalinc.com"}>
              Send Email
            </Button>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Phone Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              1-800-TATTOO-1
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "tel:1-800-828-8661"}>
              Call Us
            </Button>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

        <div className="max-w-4xl mx-auto space-y-8">
          {filteredFaqs.map((category) => (
            <div key={category.category}>
              <h3 className="text-2xl font-semibold mb-4">{category.category}</h3>
              <div className="space-y-3">
                {category.questions.map((faq, index) => {
                  const faqId = `${category.category}-${index}`;
                  const isExpanded = expandedFaq === faqId;

                  return (
                    <Card key={index} className="overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                        className="w-full p-6 text-left flex items-start justify-between hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium pr-4">{faq.q}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-6 text-muted-foreground">
                          {faq.a}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found. Try a different search term or contact support.</p>
          </div>
        )}
      </div>

      {/* Contact Form */}
      <div className="bg-muted/30 border-y">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Still Need Help?</h2>
            <p className="text-center text-muted-foreground mb-8">
              Send us a message and we'll get back to you within 24 hours
            </p>

            <Card className="p-8">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Describe your issue or question..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Universal Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
