import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Compass, MapPin, Route, Binoculars, Mountain, Radio } from "lucide-react";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Footer from "@/components/Footer";
import { getCurrentCardType, getNextCardType, formatTimeUntilNext } from "@/lib/timeBasedContent";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  // Get timezone offset for accurate city scheduling
  const tzOffset = -new Date().getTimezoneOffset(); // Convert to minutes east of UTC
  
  const { data: todaysCityData, isLoading } = useQuery({
    queryKey: ['/api/cities/today', tzOffset],
    queryFn: () => 
      fetch(`/api/cities/today?tzOffset=${tzOffset}`)
        .then(res => res.json()),
    retry: false,
  });

  // Get current time-based content info
  const currentCardInfo = getCurrentCardType();
  const nextCardInfo = getNextCardType();
  const timeUntilNext = formatTimeUntilNext();
  
  // Get the current content based on time
  const getCurrentContent = () => {
    if (currentCardInfo.type === 'preview') {
      // During preview mode, show morning content as preview
      return (todaysCityData as any)?.content?.find((c: any) => c.cardType === 'morning');
    }
    return (todaysCityData as any)?.content?.find((c: any) => c.cardType === currentCardInfo.type);
  };
  
  const currentContent = getCurrentContent();
  const city = (todaysCityData as any)?.city;
  
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };
  
  const handleViewTodaysCity = () => {
    // Go directly to the public city view - no authentication needed
    setLocation("/home");
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="site-header">
        <div className="logo-area">
          <img src="/city-discoverer-logo-nobg.png" alt="City Discoverer" className="h-48 w-auto" />
        </div>
        <div className="auth-area">
          <PushSubscribeButton />
          <a href="/library" className="library-link">Library</a>
        </div>
      </header>

      {/* Hero Section */}
      <section id="discover" className="relative">
        <div className="py-16 relative overflow-hidden" style={{background: 'linear-gradient(135deg, var(--hero-gradient-start), var(--hero-gradient-end))'}}>
          <div className="flex items-center justify-center text-center">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Explore America<br /><span className="text-yellow-300">One City at a Time</span>
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Your daily guide to city discovery.<br />Curated travel inspiration, cultural insights, and hidden gems.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={handleViewTodaysCity}
                  data-testid="button-start-journey"
                >
                  Start Daily Discovery
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  onClick={() => window.open("https://dailyfelix.org/", "_blank", "noopener,noreferrer")}
                >
                  International Cities
                </Button>
              </div>

              {/* Tune In card — visible to all visitors */}
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-2.5 rounded-md bg-white/10 border border-white/25 text-left">
                <Radio className="h-4 w-4 text-white/80 shrink-0" />
                <p className="text-sm text-white/90">
                  Hear today's city read live every day at <strong className="text-white">4pm ET</strong> on{" "}
                  <a href="https://eacd.us" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-yellow-300">
                    eacd.us
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="bg-gradient-to-br rounded-2xl p-8 text-center text-white shadow-2xl" style={{background: 'linear-gradient(135deg, var(--hero-gradient-start), var(--hero-gradient-end))'}}>
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded w-48 mx-auto mb-6"></div>
                <div className="h-8 bg-white/20 rounded-full w-32 mx-auto mb-8"></div>
                <div className="h-6 bg-white/20 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-6 bg-white/20 rounded w-2/3 mx-auto mb-6"></div>
                <div className="h-4 bg-white/20 rounded w-40 mx-auto mb-8"></div>
                <div className="h-12 bg-white/20 rounded w-48 mx-auto"></div>
              </div>
            </div>
          ) : city ? (
            <div className="bg-gradient-to-br rounded-2xl p-8 text-center text-white shadow-2xl relative" style={{background: 'linear-gradient(135deg, var(--hero-gradient-start), var(--hero-gradient-end))'}}>
              <p className="text-sm uppercase tracking-wide mb-4 text-white/80">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                }).toUpperCase()}
              </p>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-full inline-block px-8 py-3 mb-8">
                <h3 className="text-2xl font-bold">{city.name}, {city.country}</h3>
              </div>
              
              {currentContent ? (
                /* Current Time Content */
                <>
                  <blockquote className="text-lg italic mb-6 max-w-2xl mx-auto leading-relaxed">
                    "{currentContent.content}"
                  </blockquote>
                  <p className="text-sm text-white/70 mb-6">
                    —Your {currentCardInfo.label} in {city.name}
                  </p>
                </>
              ) : (
                /* Loading current content */
                <p className="text-lg mb-6">Loading today's {currentCardInfo.label.toLowerCase()}...</p>
              )}
              
              <Button 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-sm mb-6"
                onClick={handleViewTodaysCity}
                data-testid="button-visit-city"
              >
                {currentCardInfo.type === 'preview' ? 'Discover' : 'Explore'} {city.name}
              </Button>
              
              {/* Next Content Footer */}
              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-white/80 text-sm">Next:</div>
                    <div className="text-white font-medium text-sm">{nextCardInfo.label}</div>
                  </div>
                  <div className="text-white/90 font-semibold text-sm">
                    in {timeUntilNext}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br rounded-2xl p-8 text-center text-white shadow-2xl" style={{background: 'linear-gradient(135deg, #0038A8, #008ED6)'}}>
              <p className="text-lg">No city available for today</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative overflow-hidden" 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.35)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop&crop=center')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">How Daily Discovery Works</h3>
            <p className="text-xl text-white">Four curated moments throughout your day</p>
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
          <div className="mt-8 text-center">
            <Card className="bg-gradient-travel text-white border-none">
              <CardContent className="p-6">
                <h4 className="text-xl font-bold mb-3">Ready to Explore?</h4>
                <p className="text-white/90 mb-4 max-w-2xl mx-auto">
                  Join thousands of travelers discovering new cities every day. Start your journey now.
                </p>
                <Button 
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => window.open("https://citydiscoverer.ai/subscribe", "_blank")}
                  data-testid="button-join-now"
                >
                  Join City Discoverer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop&crop=center')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <MapPin className="w-12 h-12 mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-4">Trusted Travel Partnerships</h3>
            <div className="w-16 h-1 bg-gradient-travel mx-auto rounded-full mb-6"></div>
          </div>
          
          <div className="space-y-6">
            <p className="text-lg text-foreground font-medium">
              City Discoverer builds partnerships with trusted travel providers.
            </p>
            <p className="text-white font-semibold">
              We link directly to official sources so you always get the most accurate info.
            </p>
            <p className="text-lg text-blue-900 font-semibold">
              Stay in touch for exclusive partner deals
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/30">
            <div className="flex flex-wrap justify-center items-center gap-8 text-white text-sm">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Authentic Experiences
              </span>
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Verified Information
              </span>
              <span className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                Exclusive Access
              </span>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
