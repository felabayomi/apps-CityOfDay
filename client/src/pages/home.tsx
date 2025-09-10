import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Heart, Flame, MapPin, LogOut } from "lucide-react";
import { CityCard } from "@/components/city-card";
import { UserStats } from "@/components/user-stats";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { CameraCapture } from "@/components/camera-capture";
import Footer from "@/components/Footer";
import { ShareButton } from "@/components/ShareButton";
import { getCurrentCardType, formatTimeUntilNext, type CardDisplayType } from "@/lib/timeBasedContent";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  // Time-based content state
  const [currentCardInfo, setCurrentCardInfo] = useState(getCurrentCardType());
  const [timeUntilNext, setTimeUntilNext] = useState(formatTimeUntilNext());

  // Time-based content update timer
  useEffect(() => {
    const updateCardInfo = () => {
      setCurrentCardInfo(getCurrentCardType());
      setTimeUntilNext(formatTimeUntilNext());
    };

    // Update every minute to keep time display fresh
    const interval = setInterval(updateCardInfo, 60000);
    
    return () => clearInterval(interval);
  }, []);

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

  // Fetch today's city
  const { data: todaysCityData, isLoading: loadingToday } = useQuery<{city: any, content: any[]}>({
    queryKey: ["/api/cities/today"],
    retry: false,
  });

  // Fetch user's collected cities
  const { data: collectedCities, isLoading: loadingCollected } = useQuery<any[]>({
    queryKey: ["/api/user/collected"],
    retry: false,
    enabled: !!user,
  });

  // Collect city mutation
  const collectCityMutation = useMutation({
    mutationFn: async (cityId: string) => {
      await apiRequest("POST", `/api/user/collect/${cityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/collected"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "City Collected!",
        description: "Added to your digital postcard collection.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to collect city. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add to bucket list mutation
  const addToBucketListMutation = useMutation({
    mutationFn: async (cityId: string) => {
      await apiRequest("POST", `/api/user/bucket-list/${cityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/bucket-list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Added to Bucket List!",
        description: "City saved for your future adventures.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to add to bucket list. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || loadingToday) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const todaysCity = todaysCityData?.city;
  const todaysContent = todaysCityData?.content || [];

  // Get current card content based on time
  const getCurrentContent = () => {
    if (currentCardInfo.type === 'preview') {
      return null; // Show city preview instead of content cards
    }
    
    return todaysContent.find((content: any) => content.cardType === currentCardInfo.type);
  };

  const currentContent = getCurrentContent();

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
          <a href="/library">Library</a>
          {(user as any)?.email === import.meta.env.VITE_ADMIN_EMAIL && user && (
            <a href="/admin">Admin</a>
          )}
        </nav>
        <div className="auth-area">
          <button className="notif-btn" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </button>
          <div className="user-section">
            <span className="welcome-text">Welcome, {(user as any)?.firstName || 'Explorer'}</span>
            <button className="sign-in-btn" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with Today's City */}
      {todaysCity && (
        <section id="discover" className="relative">
          <div className="h-64 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}>
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Today's Featured City
                </h2>
                <h3 className="text-4xl md:text-6xl font-bold text-yellow-300 mb-4">
                  {todaysCity.name}, {todaysCity.country}
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    className="bg-white text-primary hover:bg-gray-100"
                    onClick={() => setIsCameraOpen(true)}
                    data-testid="button-collect-city"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Collect City
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                    onClick={() => addToBucketListMutation.mutate(todaysCity.id)}
                    disabled={addToBucketListMutation.isPending}
                    data-testid="button-add-bucket-list"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Add to Bucket List
                  </Button>
                  <div className="flex">
                    <ShareButton 
                      city={{ name: todaysCity.name, country: todaysCity.country }}
                      content={todaysContent.map((c: any) => ({
                        title: c.title,
                        content: c.content,
                        card_type: c.cardType,
                        image_url: c.imageUrl
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* User Stats */}
      <section className="py-8" style={{backgroundColor: '#F9F5EC'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <UserStats
              icon={MapPin}
              value={(user as any)?.discoveredCities || 0}
              label="Cities Discovered"
              color="primary"
            />
            <UserStats
              icon={Heart}
              value={(user as any)?.bucketListCities || 0}
              label="Bucket List Cities"
              color="secondary"
            />
            <UserStats
              icon={Flame}
              value={(user as any)?.currentStreak || 0}
              label="Day Streak"
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* Time-Based Content Display */}
      {todaysCity && (
        <section className="py-16" style={{backgroundColor: '#ffffff'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <h3 className="text-3xl font-bold" style={{color: 'var(--text-dark)'}}>
                {currentCardInfo.label}
              </h3>
              <Badge 
                variant="secondary" 
                className="text-sm font-medium bg-primary/10 text-primary border-primary/20"
              >
                {currentCardInfo.timeRange}
              </Badge>
            </div>
            
            {/* Time indicator */}
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10 max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-1">Next content change in:</p>
              <p className="text-lg font-semibold text-primary">{timeUntilNext}</p>
            </div>
            
            <p className="text-xl mb-4" style={{color: '#666'}}>
              {currentCardInfo.type === 'preview' 
                ? 'Preview tomorrow\'s discovery destination' 
                : 'Your current discovery moment'
              }
            </p>
            <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}></div>
          </div>

          {/* Display current content or city preview */}
          {currentCardInfo.type === 'preview' ? (
            /* City Preview Mode */
            <div className="max-w-2xl mx-auto">
              <Card className="text-center border-2 border-primary/20 shadow-lg">
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4" style={{color: 'var(--text-dark)'}}>
                    Tomorrow's Featured Destination
                  </h4>
                  <div className="text-4xl font-bold text-primary mb-6">
                    {todaysCity?.name}, {todaysCity?.country}
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    Get ready to discover amazing landmarks, local culture, and hidden gems. 
                    Your morning discovery begins at 7:00 AM!
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">7:00 AM</p>
                      <p className="font-semibold text-primary">Morning</p>
                    </div>
                    <div className="text-center p-3 bg-accent/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">11:00 AM</p>
                      <p className="font-semibold text-accent">Afternoon</p>
                    </div>
                    <div className="text-center p-3 bg-secondary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">3:00 PM</p>
                      <p className="font-semibold text-secondary">Evening</p>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">7:00 PM</p>
                      <p className="font-semibold text-primary">Bonus</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentContent ? (
            /* Current Time Card Display */
            <div className="max-w-2xl mx-auto">
              <CityCard
                content={currentContent}
                city={todaysCity}
              />
            </div>
          ) : (
            /* Loading or No Content */
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading today's {currentCardInfo.label.toLowerCase()}...</p>
            </div>
          )}

            {/* Affiliate CTA */}
            <div className="mt-12 text-center">
              <Card className="text-white border-none" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}>
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4">Ready to Visit {todaysCity?.name}?</h4>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Turn today's inspiration into tomorrow's adventure. Book your experience now.
                  </p>
                  {/* Mobile-Optimized CTA Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-4xl mx-auto">
                    {/* Custom City CTAs - Show first if they exist */}
                    {todaysCity?.cityCtaLinks && Array.isArray(todaysCity.cityCtaLinks) && todaysCity.cityCtaLinks.length > 0 && 
                      todaysCity.cityCtaLinks.map((link: any, index: number) => (
                        <Button 
                          key={`custom-${index}`}
                          className="bg-white text-primary hover:bg-gray-100 border-2 border-primary/20 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight"
                          onClick={() => window.open(link.url, '_blank')}
                          data-testid={`button-city-cta-${index}`}
                        >
                          {link.text}
                        </Button>
                      ))
                    }
                    
                    {/* Default Affiliate Buttons - Always show */}
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight" 
                      data-testid="button-book-hotels"
                      onClick={() => window.open('https://resmax.globaltravel.net/?custom1=GT20038250&custom2=resmax', '_blank')}
                    >
                      Book Hotels
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight" 
                      data-testid="button-find-tours"
                      onClick={() => window.open('https://www.viator.com/?pid=P00113651&uid=U00350276&mcid=58086&currency=USD', '_blank')}
                    >
                      Find Tours
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight" 
                      data-testid="button-search-flights"
                      onClick={() => window.open('https://globaltravel.airfareassist.com/agentsearch?cmp=R400000', '_blank')}
                    >
                      Search Flights
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight" 
                      data-testid="button-car-rental"
                      onClick={() => window.open('https://rezervco.carhire-solutions.com/', '_blank')}
                    >
                      Car Rental
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight" 
                      data-testid="button-travel-companion"
                      onClick={() => window.open('https://detect.citydiscoverer.ai/', '_blank')}
                    >
                      <span className="hidden md:inline">Smart Travel Companion</span>
                      <span className="md:hidden">Travel AI</span>
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight" 
                      data-testid="button-itinerary-planner"
                      onClick={() => window.open('https://plan.citydiscoverer.ai/', '_blank')}
                    >
                      <span className="hidden md:inline">Itinerary Planner</span>
                      <span className="md:hidden">Plan Trip</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Digital Postcards Collection */}
      {!loadingCollected && collectedCities && collectedCities.length > 0 && (
        <section className="py-16" style={{backgroundColor: '#F9F5EC'}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h4 className="text-xl font-semibold mb-6 flex items-center" style={{color: 'var(--text-dark)'}}>
              <MapPin className="mr-3 text-primary w-5 h-5" />
              Your Digital Postcards
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {collectedCities.slice(0, 11).map((city: any) => (
                <div 
                  key={city.id}
                  className="aspect-square rounded-xl overflow-hidden postcard-shadow cursor-pointer hover:transform hover:scale-105 transition-all group relative"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #3b82f6 40%, #06b6d4 70%, #10b981 100%)',
                  }}
                  data-testid={`postcard-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {/* Postcard pattern overlay */}
                  <div className="absolute inset-0 bg-white/10" 
                       style={{
                         backgroundImage: `
                           radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 1px, transparent 1px),
                           radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)
                         `,
                         backgroundSize: '20px 20px, 30px 30px, 100% 100%'
                       }}>
                  </div>
                  
                  {/* Main content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white">
                    <Globe className="w-8 h-8 text-white/90 mb-2" />
                    <div className="text-center">
                      <h5 className="text-sm font-bold text-white drop-shadow-sm leading-tight">
                        {city.name}
                      </h5>
                      <p className="text-xs text-white/80 mt-1 drop-shadow-sm">
                        {city.country}
                      </p>
                    </div>
                  </div>
                  
                  {/* Vintage postcard stamp effect */}
                  <div className="absolute top-2 right-2 w-6 h-6 border border-white/40 rounded-sm bg-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                </div>
              ))}
              
              {collectedCities.length < 12 && (
                <div 
                  className="aspect-square rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-all group hover:border-primary/50"
                  onClick={() => setIsCameraOpen(true)}
                  data-testid="button-collect-more"
                >
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform mx-auto" />
                    <p className="text-sm font-medium text-primary">Collect More</p>
                    <p className="text-xs text-muted-foreground mt-1">Discover new cities</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Premium upgrade section removed - app is now completely free */}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        currentCity={todaysCity}
      />

      <Footer />
    </div>
  );
}
