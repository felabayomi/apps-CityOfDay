import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Download, Wifi, FolderSync } from "lucide-react";
import { PricingTier } from "@/components/pricing-tier";

export default function Landing() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  const handleInstallApp = () => {
    // PWA install functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="site-header">
        <div className="logo-area">
          <div className="logo-icon">
            <Globe className="w-6 h-6" />
          </div>
          <span className="brand-name">Daily Felix</span>
          <span className="tagline">City of the Day™</span>
        </div>
        <nav className="nav-links">
          <a href="#discover">Discover</a>
          <a href="#premium">Premium</a>
        </nav>
        <div className="auth-area">
          <button className="notif-btn">
            <Bell className="w-5 h-5" />
          </button>
          <button className="sign-in-btn" onClick={handleSignIn} data-testid="button-sign-in">
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="discover" className="relative">
        <div className="h-96 bg-gradient-travel relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Explore the World<br /><span className="text-yellow-300">One City at a Time</span>
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Your daily passport to discovery. AI-curated travel inspiration delivered fresh every morning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={handleSignIn}
                  data-testid="button-start-journey"
                >
                  Start Daily Journey
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  data-testid="button-view-today"
                >
                  View Today's City
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample City Cards Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Experience Daily Discovery</h3>
            <p className="text-xl text-muted-foreground">Get inspired by cities around the world</p>
            <div className="w-24 h-1 bg-gradient-travel mx-auto rounded-full mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sample Cards */}
            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-primary opacity-50" />
                </div>
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                  Morning
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Wake Up in Paris</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Start your day with iconic landmarks and morning inspiration from the City of Light.
                </p>
                <Button variant="ghost" size="sm" className="text-primary">
                  Explore Landmark
                </Button>
              </CardContent>
            </Card>

            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-secondary opacity-50" />
                </div>
                <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground">
                  Afternoon
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Taste Local Culture</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Discover authentic local cuisine and cultural experiences that define each destination.
                </p>
                <Button variant="ghost" size="sm" className="text-secondary">
                  Find Cafés
                </Button>
              </CardContent>
            </Card>

            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full bg-gradient-to-br from-destructive/20 to-secondary/20 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-destructive opacity-50" />
                </div>
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                  Evening
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Budget Smart Tips</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Learn insider secrets to save money while experiencing the best each city offers.
                </p>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Save Money
                </Button>
              </CardContent>
            </Card>

            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-accent opacity-50" />
                </div>
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  Fun Fact
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Did You Know?</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Fascinating historical facts and cultural insights you won't find in guidebooks.
                </p>
                <Button variant="ghost" size="sm" className="text-primary">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-travel text-white border-none">
              <CardContent className="p-8">
                <h4 className="text-2xl font-bold mb-4">Ready to Explore?</h4>
                <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                  Join thousands of travelers discovering new cities every day. Start your journey now.
                </p>
                <Button 
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100"
                  onClick={handleSignIn}
                  data-testid="button-join-now"
                >
                  Join Daily Felix
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section id="premium" className="py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Choose Your Travel Experience</h3>
            <p className="text-xl text-muted-foreground">From daily inspiration to premium adventures</p>
            <div className="w-24 h-1 bg-gradient-travel mx-auto rounded-full mt-4"></div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
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
              buttonAction={() => handleSignIn()}
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
        </div>
      </section>

      {/* PWA Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Install & Take Anywhere</h3>
            <p className="text-xl text-muted-foreground">Works offline, installs like a native app</p>
            <div className="w-24 h-1 bg-gradient-travel mx-auto rounded-full mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-2xl font-semibold text-foreground mb-4">Progressive Web App Features</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Download className="text-primary w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Install on Any Device</h5>
                    <p className="text-sm text-muted-foreground">Add to home screen and use like a native app</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Wifi className="text-primary w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Works Offline</h5>
                    <p className="text-sm text-muted-foreground">Access your collected cities without internet</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Bell className="text-primary w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Smart Notifications</h5>
                    <p className="text-sm text-muted-foreground">Get reminders for daily discoveries</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FolderSync className="text-primary w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Background FolderSync</h5>
                    <p className="text-sm text-muted-foreground">Auto-updates when connection returns</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-64 h-96 mx-auto rounded-2xl border-4 border-border bg-card postcard-shadow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-travel opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-24 h-24 text-primary opacity-30" />
                </div>
              </div>
              <Button 
                className="mt-6" 
                onClick={handleInstallApp}
                data-testid="button-install-app"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Globe className="text-white w-4 h-4" />
                </div>
                <h5 className="text-lg font-semibold">Daily Felix</h5>
              </div>
              <p className="text-background/70 text-sm">
                Your daily window into the world. Discover a new city every day with AI-curated travel inspiration.
              </p>
            </div>

            <div>
              <h6 className="font-semibold text-background mb-4">Product</h6>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">Features</a></li>
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">Pricing</a></li>
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">API</a></li>
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold text-background mb-4">Company</h6>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">About</a></li>
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">Blog</a></li>
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">Careers</a></li>
                <li><a href="#" className="text-background/70 hover:text-background transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold text-background mb-4">Connect</h6>
              <div className="flex space-x-4">
                <a href="#" className="w-8 h-8 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                  <span className="text-background text-sm">𝕏</span>
                </a>
                <a href="#" className="w-8 h-8 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                  <span className="text-background text-sm">📷</span>
                </a>
                <a href="#" className="w-8 h-8 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-colors">
                  <span className="text-background text-sm">📘</span>
                </a>
              </div>
            </div>
          </div>

          <hr className="border-background/20 my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-background/70 text-sm">© 2024 Daily Felix. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Privacy</a>
              <a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Terms</a>
              <a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
