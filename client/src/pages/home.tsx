import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Heart, Flame, MapPin } from "lucide-react";
import { CityCard } from "@/components/city-card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { ShareButton } from "@/components/ShareButton";
import { getCurrentCardType, getNextCardType, formatTimeUntilNext, type CardDisplayType } from "@/lib/timeBasedContent";

export default function Home() {
  const { toast } = useToast();
  
  // Time-based content state
  const [currentCardInfo, setCurrentCardInfo] = useState(getCurrentCardType());
  const [nextCardInfo, setNextCardInfo] = useState(getNextCardType());
  const [timeUntilNext, setTimeUntilNext] = useState(formatTimeUntilNext());

  // Time-based content update timer
  useEffect(() => {
    const updateCardInfo = () => {
      setCurrentCardInfo(getCurrentCardType());
      setNextCardInfo(getNextCardType());
      setTimeUntilNext(formatTimeUntilNext());
    };

    // Update every minute to keep time display fresh
    const interval = setInterval(updateCardInfo, 60000);
    
    return () => clearInterval(interval);
  }, []);


  // Fetch today's city
  const { data: todaysCityData, isLoading: loadingToday } = useQuery<{city: any, content: any[]}>({
    queryKey: ["/api/cities/today"],
    retry: false,
  });

  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  if (loadingToday) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const todaysCity = todaysCityData?.city;
  const todaysContent = todaysCityData?.content || [];

  // Get current card content based on time
  const getCurrentContent = () => {
    if (currentCardInfo.type === 'preview') {
      // During preview mode, show morning content as preview
      return todaysContent.find((content: any) => content.cardType === 'morning');
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
        <div className="auth-area">
          <a href="/library" className="library-link">Library</a>
          <a href="/admin" className="admin-link">Admin</a>
          <button className="notif-btn" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </button>
          <button className="sign-in-btn" onClick={handleSignIn} data-testid="button-sign-in">
            Sign In
          </button>
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
                  {/* User interaction buttons removed - app is now fully public */}
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

      {/* User stats section removed - app is now fully public */}

      {/* Time-Based Content Display */}
      <section className="py-16" style={{backgroundColor: '#ffffff'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <h3 className="text-3xl font-bold" style={{color: 'var(--text-dark)'}}>
                {currentCardInfo.label}
              </h3>
            </div>
            
            
            <p className="text-xl mb-4" style={{color: '#666'}}>
              {currentCardInfo.type === 'preview' 
                ? 'Preview tomorrow\'s discovery destination' 
                : 'Your current discovery moment'
              }
            </p>
            <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}></div>
          </div>

          {/* Display current content */}
          <div className="max-w-2xl mx-auto">
            <CityCard
              content={currentContent || {
                id: "fallback",
                cardType: "morning",
                title: todaysCity?.name ? `Discover ${todaysCity.name}` : "City Discovery",
                content: "Connect to see today's discovery content for this amazing destination.",
                imageUrl: null,
                affiliateLinks: null,
                createdAt: null,
                updatedAt: null,
                cityId: null
              }}
              city={todaysCity || { name: "Your City" }}
              nextCardTitle={nextCardInfo.label}
              timeUntilNext={timeUntilNext}
            />
          </div>

            {/* Affiliate CTA */}
            <div className="mt-12 text-center">
              <Card className="text-white border-none" style={{background: 'linear-gradient(135deg, #3A7CA5, #2A5B7A)'}}>
                <CardContent className="p-8">
                  <h4 className="text-2xl font-bold mb-4">Ready to Visit {todaysCity?.name}?</h4>
                  <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                    Turn today's inspiration into tomorrow's adventure. Book your experience now.
                  </p>
                  {/* Compact CTA Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
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

      {/* Camera and collection features removed - app is now fully public */}

      <Footer />
    </div>
  );
}
