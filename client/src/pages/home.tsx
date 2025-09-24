import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Heart, Flame, MapPin, ChevronDown, ChevronRight, Share2 } from "lucide-react";
import { CityCard } from "@/components/city-card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { ShareButton } from "@/components/ShareButton";
import { getCurrentCardType, getNextCardType, formatTimeUntilNext, type CardDisplayType } from "@/lib/timeBasedContent";
import * as Collapsible from "@radix-ui/react-collapsible";

export default function Home() {
  const { toast } = useToast();
  
  // Time-based content state
  const [currentCardInfo, setCurrentCardInfo] = useState(getCurrentCardType());
  const [nextCardInfo, setNextCardInfo] = useState(getNextCardType());
  const [timeUntilNext, setTimeUntilNext] = useState(formatTimeUntilNext());
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);

  // Share itinerary functionality
  const handleShareItinerary = async () => {
    if (!todaysCity) return;
    
    // Create concise Twitter-style snippet under 280 characters
    const shareText = `🏛 ${todaysCity.name}, ${todaysCity.country} Itinerary
Come to explore. Stay to discover what makes this city unforgettable.

✨ Plan: https://citydiscoverer.guide/contact
📄 Full Guide: https://daily.citydiscoverer.guide/home`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Itinerary copied!",
        description: "Concise itinerary snippet copied - perfect for sharing!",
      });
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: "Itinerary copied!",
        description: "Concise itinerary snippet copied - perfect for sharing!",
      });
    }
  };

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
      {/* Header */}
      <header className="site-header">
        <div className="logo-area">
          <div className="logo-icon">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">Daily Felix</span>
          <span className="tagline">City Explorer</span>
        </div>
        <nav className="nav-links">
          <a href="/" className="home-link">Home</a>
          <a href="/library" className="library-link">Library</a>
        </nav>
      </header>

      {/* Hero Section - Current City & Current Card */}
      {todaysCity && (
        <section className="relative overflow-hidden py-20 bg-gradient-to-br from-primary to-accent text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              {todaysCity.name}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              {todaysCity.country}
            </p>

            {/* Current Time-Based Card Highlight */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Badge variant="secondary" className="text-sm font-medium bg-white/20 text-white border-white/30">
                  <Flame className="w-4 h-4 mr-1" />
                  {currentCardInfo.label} is live now
                </Badge>
              </div>
              <p className="text-lg mb-2 text-white/90">
                {currentCardInfo.description}
              </p>
              <p className="text-sm text-white/70">
                Next: {nextCardInfo.label} in {timeUntilNext}
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-center gap-4">
                <ShareButton 
                  city={{
                    id: todaysCity.id,
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
            <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{background: 'linear-gradient(135deg, #0038A8, #F2AF00)'}}></div>
          </div>

          {/* Sample Itinerary HTML Section - Collapsible */}
          {todaysCity?.sampleItinerary && (
            <div className="max-w-4xl mx-auto mb-12">
              <Collapsible.Root open={isItineraryOpen} onOpenChange={setIsItineraryOpen}>
                <Collapsible.Trigger asChild>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="w-full p-3 md:p-4 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg mb-4 antialiased font-semibold overflow-hidden"
                      data-testid="button-toggle-itinerary"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isItineraryOpen ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <h4 className="text-lg font-bold text-center">
                          <span className="hidden md:inline">Sample Itinerary for {todaysCity.name}</span>
                          <span className="md:hidden">Sample Itinerary</span>
                        </h4>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareItinerary();
                      }}
                      data-testid="button-share-itinerary"
                      title="Share this itinerary"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content className="animate-in slide-in-from-top-2 duration-200">
                  <div 
                    className="sample-itinerary-content text-left bg-white rounded-lg p-6 border border-gray-300 antialiased text-gray-900"
                    dangerouslySetInnerHTML={{ __html: todaysCity.sampleItinerary }}
                    data-testid="sample-itinerary-content"
                  />
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizedContent.map(({ cardType, content, isCurrent }) => (
              <CityCard 
                key={cardType}
                content={content}
                city={todaysCity}
                isCurrent={isCurrent}
              />
            ))}
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
                  onClick={() => window.open('https://viator.prf.hn/click/camref:1101l4RREX/creativeref:1101l32239', '_blank')}
                >
                  Find Tours
                </Button>
              </CardContent>
            </Card>

            {/* Book Flights Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h5 className="text-lg font-semibold mb-4">Book Flights</h5>
                <p className="text-sm text-muted-foreground mb-4">Compare flights from multiple airlines and find the best deals for your next trip.</p>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  data-testid="button-book-flights"
                  onClick={() => window.open('https://resmax.globaltravel.net/?custom1=GT20038250&custom2=resmax', '_blank')}
                >
                  Book Flights
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}