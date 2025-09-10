import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Compass, MapPin, Route, Binoculars, Mountain } from "lucide-react";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };
  
  const handleViewTodaysCity = () => {
    setLocation("/preview");
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="site-header">
        <div className="logo-area">
          <div className="logo-icon">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">City Discoverer</span>
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

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">How Daily Discovery Works</h3>
            <p className="text-xl text-muted-foreground">Four curated moments throughout your day</p>
            <div className="w-24 h-1 bg-gradient-travel mx-auto rounded-full mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Morning Feature */}
            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300 text-center">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Mountain className="w-10 h-10 text-white" />
                  </div>
                  <Badge style={{backgroundColor: 'var(--primary-yellow)', color: 'var(--text-dark)'}}>
                    Morning
                  </Badge>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Wake Up With Cities</h4>
                <p className="text-muted-foreground text-sm">
                  Start each day exploring iconic landmarks and cultural moments from a new destination around the world.
                </p>
              </CardContent>
            </Card>

            {/* Afternoon Feature */}
            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300 text-center">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4">
                    <Compass className="w-10 h-10 text-white" />
                  </div>
                  <Badge style={{backgroundColor: 'var(--accent-blue)', color: 'var(--text-light)'}}>
                    Afternoon
                  </Badge>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Taste Local Culture</h4>
                <p className="text-muted-foreground text-sm">
                  Discover authentic cuisine, local traditions, and cultural experiences unique to each featured city.
                </p>
              </CardContent>
            </Card>

            {/* Evening Feature */}
            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300 text-center">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                    <Route className="w-10 h-10 text-white" />
                  </div>
                  <Badge style={{backgroundColor: 'var(--primary-yellow)', color: 'var(--text-dark)'}}>
                    Evening
                  </Badge>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Budget Smart Tips</h4>
                <p className="text-muted-foreground text-sm">
                  Learn insider secrets and money-saving strategies to experience the best each city offers affordably.
                </p>
              </CardContent>
            </Card>

            {/* Bonus Feature */}
            <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300 text-center">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4">
                    <Binoculars className="w-10 h-10 text-white" />
                  </div>
                  <Badge style={{backgroundColor: 'var(--accent-blue)', color: 'var(--text-light)'}}>
                    Bonus
                  </Badge>
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-3">Hidden Insights</h4>
                <p className="text-muted-foreground text-sm">
                  Uncover fascinating historical facts and cultural insights you won't find in typical guidebooks.
                </p>
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
                  Join City Discoverer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      {/* Premium section removed - app is now completely free */}


      <Footer />
    </div>
  );
}
