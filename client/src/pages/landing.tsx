import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Download, Wifi, FolderSync, Compass, MapPin, Map, Navigation, Route, Plane, Camera, Binoculars, Mountains } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };
  
  const handleViewTodaysCity = () => {
    setLocation("/preview");
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
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">Daily Felix</span>
          <span className="tagline">City of the Day™</span>
        </div>
        <nav className="nav-links">
          <a href="#discover">Discover</a>
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
        <div className="h-96 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}>
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Explore the World<br /><span className="text-yellow-300">One City at a Time</span>
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Your daily guide to city discovery.<br />Curated travel inspiration, cultural insights, and hidden gems.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={handleSignIn}
                  data-testid="button-start-journey"
                >
                  Start Daily Journey
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 border-2"
                  onClick={handleViewTodaysCity}
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
                <div className="w-full h-full relative">
                  <img src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop&crop=top" alt="New York City skyline" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <Badge className="absolute top-4 left-4" style={{backgroundColor: 'var(--primary-yellow)', color: 'var(--text-dark)'}}>
                  Morning
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Wake Up in Paris</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Start your day with iconic landmarks and morning inspiration from the City of Light.
                </p>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Explore Landmark
                </Button>
              </CardContent>
            </Card>

            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full relative">
                  <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center" alt="San Francisco Golden Gate Bridge" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <Badge className="absolute top-4 left-4" style={{backgroundColor: 'var(--accent-blue)', color: 'var(--text-light)'}}>
                  Afternoon
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Taste Local Culture</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Discover authentic local cuisine and cultural experiences that define each destination.
                </p>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Find Cafés
                </Button>
              </CardContent>
            </Card>

            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full relative">
                  <img src="https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&h=300&fit=crop&crop=center" alt="Chicago skyline at sunset" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <Badge className="absolute top-4 left-4" style={{backgroundColor: 'var(--primary-yellow)', color: 'var(--text-dark)'}}>
                  Evening
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Budget Smart Tips</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Learn insider secrets to save money while experiencing the best each city offers.
                </p>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Save Money
                </Button>
              </CardContent>
            </Card>

            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <div className="w-full h-full relative">
                  <img src="https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=400&h=300&fit=crop&crop=center" alt="Los Angeles downtown skyline" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <Badge className="absolute top-4 left-4" style={{backgroundColor: 'var(--accent-blue)', color: 'var(--text-light)'}}>
                  Fun Fact
                </Badge>
              </div>
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">Did You Know?</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Fascinating historical facts and cultural insights you won't find in guidebooks.
                </p>
                <Button variant="ghost" size="sm" className="text-blue-600">
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
                  className="bg-white text-blue-600 hover:bg-gray-100"
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
      {/* Premium section removed - app is now completely free */}

      {/* PWA Features Section */}
      <section className="pwa-section">
        <div>
          <h2>Install & Take Anywhere</h2>
          <p style={{color: '#666', marginBottom: '2rem'}}>Works offline, installs like a native app</p>
          <ul>
            <li style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Download className="w-5 h-5" style={{color: 'var(--accent-blue)'}} />
              Install on Any Device - Add to home screen and use like a native app
            </li>
            <li style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Wifi className="w-5 h-5" style={{color: 'var(--accent-blue)'}} />
              Works Offline - Access your collected cities without internet
            </li>
            <li style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Bell className="w-5 h-5" style={{color: 'var(--accent-blue)'}} />
              Smart Notifications - Get reminders for daily discoveries
            </li>
            <li style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <FolderSync className="w-5 h-5" style={{color: 'var(--accent-blue)'}} />
              Background Sync - Auto-updates when connection returns
            </li>
          </ul>
        </div>

        <div className="text-center">
          <div className="w-64 h-96 mx-auto rounded-2xl border-4 border-border bg-card postcard-shadow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-travel opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-24 h-24 text-primary opacity-30 globe-animate" />
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
      </section>

      {/* Footer */}
      <footer>
        <div className="column">
          <h4>Daily Felix</h4>
          <p>Your daily guide to city discovery</p>
        </div>
        
        <div className="column">
          <h4>Product</h4>
          <ul>
            <li><a href="#discover">Features</a></li>
            <li><a href="#">Mobile App</a></li>
          </ul>
        </div>
        
        <div className="column">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        
        <div className="column">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
        
        <div className="column">
          <p>© 2024 Daily Felix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
