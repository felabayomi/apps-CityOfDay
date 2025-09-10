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
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <a href="/admin">Admin</a>
          <a href="#premium">Premium</a>
        </nav>
        <div className="auth-area">
          <button className="notif-btn" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </button>
          <div className="user-section">
            <span className="welcome-text">Welcome, {user.firstName || 'Explorer'}</span>
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
                <div className="flex justify-center space-x-4">
                  <Button 
                    className="bg-white text-primary hover:bg-gray-100"
                    onClick={() => collectCityMutation.mutate(todaysCity.id)}
                    disabled={collectCityMutation.isPending}
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
              value={user.discoveredCities || 0}
              label="Cities Discovered"
              color="primary"
            />
            <UserStats
              icon={Heart}
              value={user.bucketListCities || 0}
              label="Bucket List Cities"
              color="secondary"
            />
            <UserStats
              icon={Flame}
              value={user.currentStreak || 0}
              label="Day Streak"
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* Today's Content Cards */}
      {todaysContent.length > 0 && (
        <section className="py-16" style={{backgroundColor: '#ffffff'}}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4" style={{color: 'var(--text-dark)'}}>Today's Discovery Cards</h3>
              <p className="text-xl mb-4" style={{color: '#666'}}>Your daily dose of travel inspiration</p>
              <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {todaysContent
                .sort((a: any, b: any) => {
                  const order = { morning: 0, afternoon: 1, evening: 2, bonus: 3 };
                  return order[a.cardType as keyof typeof order] - order[b.cardType as keyof typeof order];
                })
                .map((content: any) => (
                  <CityCard
                    key={content.id}
                    content={content}
                    city={todaysCity}
                  />
                ))}
            </div>

            {/* Affiliate CTA */}
            <div className="mt-12 text-center">
              <Card className="text-white border-none" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}>
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4">Ready to Visit {todaysCity?.name}?</h4>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Turn today's inspiration into tomorrow's adventure. Book your experience now.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    {/* Custom City CTAs - Show first if they exist */}
                    {todaysCity?.cityCtaLinks && Array.isArray(todaysCity.cityCtaLinks) && todaysCity.cityCtaLinks.length > 0 && 
                      todaysCity.cityCtaLinks.map((link: any, index: number) => (
                        <Button 
                          key={`custom-${index}`}
                          className="bg-white text-primary hover:bg-gray-100 border-2 border-primary/20" 
                          onClick={() => window.open(link.url, '_blank')}
                          data-testid={`button-city-cta-${index}`}
                        >
                          {link.text}
                        </Button>
                      ))
                    }
                    
                    {/* Default Affiliate Buttons - Always show */}
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100" 
                      data-testid="button-book-hotels"
                      onClick={() => window.open('https://resmax.globaltravel.net/?custom1=GT20038250&custom2=resmax', '_blank')}
                    >
                      Book Hotels
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100" 
                      data-testid="button-find-tours"
                      onClick={() => window.open('https://www.viator.com/?pid=P00113651&uid=U00350276&mcid=58086&currency=USD', '_blank')}
                    >
                      Find Tours
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100" 
                      data-testid="button-search-flights"
                      onClick={() => window.open('https://globaltravel.airfareassist.com/agentsearch?cmp=R400000', '_blank')}
                    >
                      Search Flights
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100" 
                      data-testid="button-car-rental"
                      onClick={() => window.open('https://rezervco.carhire-solutions.com/', '_blank')}
                    >
                      Car Rental
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100" 
                      data-testid="button-travel-companion"
                      onClick={() => window.open('https://detect.citydiscoverer.ai/', '_blank')}
                    >
                      Smart Travel Companion
                    </Button>
                    <Button 
                      className="bg-white text-primary hover:bg-gray-100" 
                      data-testid="button-itinerary-planner"
                      onClick={() => window.open('https://plan.citydiscoverer.ai/', '_blank')}
                    >
                      Itinerary Planner
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
                  className="aspect-square rounded-lg overflow-hidden postcard-shadow cursor-pointer hover:transform hover:scale-105 transition-all group bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative"
                  data-testid={`postcard-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Globe className="w-8 h-8 text-primary opacity-30" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end p-2">
                    <span className="text-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {city.name}
                    </span>
                  </div>
                </div>
              ))}
              
              {collectedCities.length < 12 && (
                <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors group">
                  <div className="text-center">
                    <MapPin className="w-6 h-6 text-muted-foreground mb-2 group-hover:text-foreground transition-colors mx-auto" />
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Collect More</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Premium Upgrade Prompt */}
      {user.subscriptionTier === 'free' && (
        <section className="py-12" style={{backgroundColor: '#ffffff'}}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle style={{color: 'var(--text-dark)'}}>Unlock Premium Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6" style={{color: '#666'}}>
                  Get access to city archives, detailed itineraries, exclusive deals, and more.
                </p>
                <Button asChild data-testid="button-upgrade-premium">
                  <a href="/subscribe">Upgrade to Premium</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
