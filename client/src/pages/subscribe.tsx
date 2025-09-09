import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Check, Crown, LogOut } from "lucide-react";
import { PricingTier } from "@/components/pricing-tier";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Daily Felix Premium!",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center">
          <Crown className="w-5 h-5 mr-2 text-primary" />
          Complete Your Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe}
            data-testid="button-complete-subscription"
          >
            Subscribe to Premium
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Subscribe() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleCreateSubscription = async () => {
    if (!user) return;
    
    setIsLoadingSubscription(true);
    try {
      const response = await apiRequest("POST", "/api/get-or-create-subscription");
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-primary-foreground w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Daily Felix</h1>
              <Badge className="bg-secondary text-secondary-foreground">Premium</Badge>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">Admin</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.firstName || 'Explorer'}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Unlock Premium Travel Experiences
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get exclusive content, detailed itineraries, and advanced features to enhance your travel discovery journey.
          </p>
          <div className="w-24 h-1 bg-gradient-travel mx-auto rounded-full mt-6"></div>
        </div>

        {/* Current Subscription Status */}
        {user.subscriptionTier && (
          <div className="mb-12">
            <Card className={`text-center ${
              user.subscriptionTier === 'premium' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Crown className={`w-6 h-6 mr-2 ${
                    user.subscriptionTier === 'premium' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <h3 className="text-lg font-semibold text-foreground">
                    Current Plan: {user.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                  </h3>
                </div>
                {user.subscriptionTier === 'free' ? (
                  <p className="text-muted-foreground mb-4">
                    Upgrade to Premium to unlock exclusive features and content.
                  </p>
                ) : (
                  <p className="text-muted-foreground mb-4">
                    You're enjoying all Premium features. Thank you for being a valued subscriber!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Tiers */}
        {(!user.subscriptionTier || user.subscriptionTier === 'free') && (
          <>
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <PricingTier
                title="Explorer"
                price="$0"
                description="Perfect for daily inspiration"
                features={[
                  "Daily city discovery",
                  "4 content cards per day", 
                  "Basic travel tips",
                  "Community access"
                ]}
                limitations={["City archive access", "Detailed itineraries", "Exclusive deals"]}
                buttonText="Current Plan"
                buttonVariant="secondary"
                disabled
              />

              <PricingTier
                title="Wanderer"
                price="$7"
                description="For serious travelers"
                features={[
                  "Everything in Explorer",
                  "Complete city archive",
                  "Detailed itineraries", 
                  "Exclusive travel deals",
                  "Download city guides",
                  "Priority support"
                ]}
                popular
                buttonText="Start Free Trial"
                buttonAction={handleCreateSubscription}
                loading={isLoadingSubscription}
                data-testid="button-premium-signup"
              />

              <PricingTier
                title="Globe Trotter"
                price="$15"
                description="For travel professionals"
                features={[
                  "Everything in Wanderer",
                  "White-label options",
                  "API access",
                  "Analytics dashboard",
                  "Custom content",
                  "Dedicated support"
                ]}
                buttonText="Contact Sales"
                buttonVariant="outline"
              />
            </div>

            {/* Payment Form */}
            {clientSecret && (
              <div className="mt-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Complete Your Subscription</h3>
                  <p className="text-muted-foreground">
                    You're just one step away from unlocking premium features!
                  </p>
                </div>
                
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              </div>
            )}
          </>
        )}

        {/* Premium Features Showcase */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          <Card className="postcard-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Complete City Archive</h4>
              <p className="text-muted-foreground text-sm">
                Access our entire collection of over 500+ cities from around the world.
              </p>
            </CardContent>
          </Card>

          <Card className="postcard-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Detailed Itineraries</h4>
              <p className="text-muted-foreground text-sm">
                Get comprehensive 3-7 day itineraries for each city with insider recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="postcard-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-accent" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Exclusive Deals</h4>
              <p className="text-muted-foreground text-sm">
                Save up to 30% on hotels, tours, and experiences with our partner network.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Money-back Guarantee */}
        <div className="text-center mt-12 p-6 bg-muted/30 rounded-lg">
          <h4 className="text-lg font-semibold text-foreground mb-2">30-Day Money-Back Guarantee</h4>
          <p className="text-muted-foreground">
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
