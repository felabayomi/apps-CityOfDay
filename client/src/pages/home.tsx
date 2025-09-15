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


  // Get timezone offset for accurate city scheduling
  const tzOffset = -new Date().getTimezoneOffset(); // Convert to minutes east of UTC
  
  // Fetch today's city
  const { data: todaysCityData, isLoading: loadingToday } = useQuery<{city: any, content: any[]}>({
    queryKey: ["/api/cities/today", tzOffset],
    queryFn: () => 
      fetch(`/api/cities/today?tzOffset=${tzOffset}`)
        .then(res => res.json()),
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

  // Organize content by card type for display
  const organizedContent = ['morning', 'afternoon', 'evening', 'bonus', 'luxury', 'wildlife'].map(cardType => {
    const content = todaysContent.find((content: any) => content.cardType === cardType);
    return {
      cardType,
      content: content || {
        id: `fallback-${cardType}`,
        cardType,
        title: `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Discovery`,
        content: `Discover amazing ${cardType} activities in ${todaysCity?.name || 'this city'}.`,
        imageUrl: null,
        affiliateLinks: null,
        createdAt: null,
        updatedAt: null,
        cityId: null
      },
      isCurrent: currentCardInfo.type === cardType
    };
  });

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
          <a href="/" className="home-link">Home</a>
          <a href="/library" className="library-link">Library</a>
        </div>
      </header>

      {/* Hero Section with Today's City */}
      {todaysCity && (
        <section id="discover" className="relative">
          <div className="h-64 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #002D72, #FFD200)'}}>
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
                      city={{ 
                        name: todaysCity.name, 
                        country: todaysCity.country,
                        morningShareTemplate: todaysCity.morningShareTemplate,
                        afternoonShareTemplate: todaysCity.afternoonShareTemplate,
                        eveningShareTemplate: todaysCity.eveningShareTemplate,
                        bonusShareTemplate: todaysCity.bonusShareTemplate,
                        luxuryShareTemplate: todaysCity.luxuryShareTemplate,
                        wildlifeShareTemplate: todaysCity.wildlifeShareTemplate,
                      }}
                      content={todaysContent.map((c: any) => ({
                        title: c.title,
                        content: c.content,
                        card_type: c.cardType,
                        image_url: c.imageUrl
                      }))}
                      shareType="page"
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
                Today's Discovery Cards
              </h3>
            </div>
            
            
            <p className="text-xl mb-4" style={{color: '#666'}}>
              Explore Morning Discovery, Afternoon Culture, Evening Experiences, Bonus Facts, Luxury Experiences, and Wildlife — all at once
            </p>
            <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{background: 'linear-gradient(135deg, #002D72, #FFD200)'}}></div>
          </div>

          {/* Sample Itinerary HTML Section */}
          {todaysCity?.sampleItinerary && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold" style={{color: 'var(--text-dark)'}}>
                  Sample Itinerary for {todaysCity.name}
                </h4>
              </div>
              <div 
                className="sample-itinerary-content"
                dangerouslySetInnerHTML={{ __html: todaysCity.sampleItinerary }}
                data-testid="sample-itinerary-content"
              />
            </div>
          )}

          {/* Display all content cards */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {organizedContent.map((item) => (
                <CityCard
                  key={item.cardType}
                  content={item.content}
                  city={todaysCity || { name: "Your City" }}
                  nextCardTitle={item.isCurrent ? nextCardInfo.label : undefined}
                  timeUntilNext={item.isCurrent ? timeUntilNext : undefined}
                  isCurrent={item.isCurrent}
                />
              ))}
            </div>
          </div>

          </div>
        </section>

      {/* Travel Booking Hub - Always visible */}
      <section className="py-16" style={{backgroundColor: '#f8f9fa'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* City-Specific CTAs - Show first when available */}
          {todaysCity?.cityCtaLinks && Array.isArray(todaysCity.cityCtaLinks) && todaysCity.cityCtaLinks.length > 0 && (
            <div className="mb-12">
              <div className="text-center mb-6">
                <h5 className="text-lg font-semibold">Today's {todaysCity.name} Specials</h5>
                <p className="text-muted-foreground text-sm">City-specific recommendations and deals</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
                {todaysCity.cityCtaLinks.map((link: any, index: number) => (
                  <Button 
                    key={`custom-${index}`}
                    className="bg-white text-primary hover:bg-gray-100 border-2 border-primary/20 text-xs md:text-sm px-2 md:px-4 py-2 md:py-2 h-auto min-h-[44px] whitespace-normal leading-tight"
                    onClick={() => window.open(link.url, '_blank')}
                    data-testid={`button-city-cta-${index}`}
                  >
                    {link.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h4 className="text-2xl font-bold mb-4">Ready to Explore {todaysCity?.name || "the World"}?</h4>
            <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
              Turn today's inspiration into tomorrow's adventure. Book your experience now.
            </p>
            <p className="text-sm font-bold bg-yellow-100 border border-yellow-300 rounded-md px-4 py-2 mb-6 max-w-2xl mx-auto text-yellow-800">
              Agent Support: Send us your booking confirmation for tracking and assistance.
            </p>
          </div>
          
          {/* Travel Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Book Hotels Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Book Hotels</h5>
                <p className="text-sm text-muted-foreground mb-4">Find and book accommodations worldwide with competitive rates and exclusive deals.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-book-hotels"
                  onClick={() => window.open('https://resmax.globaltravel.net/?custom1=GT20038250&custom2=resmax', '_blank')}
                >
                  Book Hotels
                </Button>
              </CardContent>
            </Card>

            {/* Find Tours Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Find Tours</h5>
                <p className="text-sm text-muted-foreground mb-4">Discover amazing experiences and guided tours to make the most of your destination.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-find-tours"
                  onClick={() => window.open('https://www.viator.com/?pid=P00113651&uid=U00350276&mcid=58086&currency=USD', '_blank')}
                >
                  Find Tours
                </Button>
              </CardContent>
            </Card>

            {/* Search Flights Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Search Flights</h5>
                <p className="text-sm text-muted-foreground mb-4">Compare and book flights from multiple airlines to get the best deals for your trip.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-search-flights"
                  onClick={() => window.open('https://globaltravel.airfareassist.com/agentsearch?cmp=R400000', '_blank')}
                >
                  Search Flights
                </Button>
              </CardContent>
            </Card>

            {/* Car Rental Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Car Rental</h5>
                <p className="text-sm text-muted-foreground mb-4">Rent a car for ultimate freedom and flexibility during your travels.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-car-rental"
                  onClick={() => window.open('https://rezervco.carhire-solutions.com/', '_blank')}
                >
                  Car Rental
                </Button>
              </CardContent>
            </Card>

            {/* Smart Travel Companion Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Smart Travel Companion</h5>
                <p className="text-sm text-muted-foreground mb-4">Get AI-powered travel insights and recommendations tailored to your preferences.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-travel-companion"
                  onClick={() => window.open('https://detect.citydiscoverer.ai/', '_blank')}
                >
                  Smart Travel Companion
                </Button>
              </CardContent>
            </Card>

            {/* Itinerary Planner Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Itinerary Planner</h5>
                <p className="text-sm text-muted-foreground mb-4">Plan your perfect trip with our intelligent itinerary planning tools.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-itinerary-planner"
                  onClick={() => window.open('https://plan.citydiscoverer.ai/', '_blank')}
                >
                  Itinerary Planner
                </Button>
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
