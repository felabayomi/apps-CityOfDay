import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, ChevronDown, ChevronRight, Share2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { CityCard } from "@/components/city-card";
import Footer from "@/components/Footer";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CityDetail() {
  const { id } = useParams<{ id: string }>();
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const { toast } = useToast();

  // Share itinerary functionality
  const handleShareItinerary = async (city: any) => {
    if (!city) return;
    
    // Create concise Twitter-style snippet under 280 characters
    const shareText = `🏛 ${city.name}, ${city.country} Itinerary
Come to explore. Stay to discover what makes this city unforgettable.

✨ Plan: https://citydiscoverer.guide/contact
📄 Full Guide: https://daily.citydiscoverer.guide`;

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

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/cities/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const response = data as any;
  const city = response?.city || response;
  const content = response?.content || [];

  if (error || !city) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">City Not Found</h2>
          <p className="text-muted-foreground mb-6">The city you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="site-header">
        <div className="logo-area">
          <img src="/city-discoverer-logo-nobg.png" alt="City Discoverer" className="h-48 w-auto" />
        </div>
        <nav className="nav-links">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section - Full layout like home page */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-primary to-accent text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            {city.name}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            {city.country}
          </p>
          <div className="space-y-2 mb-8">
            <p className="text-xl mb-4" style={{color: '#FFF'}}>
              Explore Morning Discovery, Afternoon Culture, Evening Experiences, Bonus Facts, Luxury Experiences, and Wildlife — all at once
            </p>
            <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{background: 'linear-gradient(135deg, #0038A8, #F2AF00)'}}></div>
          </div>

          {/* City Highlights */}
          {city?.highlights && Array.isArray(city.highlights) && city.highlights.length > 0 && (
            <div className="max-w-2xl mx-auto mb-8 text-left">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">City Highlights</span>
              </div>
              <ul className="space-y-2">
                {(city.highlights as string[]).map((highlight: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/90 bg-white/10 rounded-md px-4 py-2">
                    <span className="text-yellow-300 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sample Itinerary HTML Section - Collapsible */}
          {city?.sampleItinerary && (
            <div className="max-w-4xl mx-auto mb-12">
              <Collapsible.Root open={isItineraryOpen} onOpenChange={setIsItineraryOpen}>
                <Collapsible.Trigger asChild>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="w-full p-3 md:p-4 text-white hover:bg-white/10 border border-white/20 rounded-lg mb-4 antialiased font-semibold overflow-hidden"
                      data-testid="button-toggle-itinerary"
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isItineraryOpen ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <h4 className="text-lg font-bold text-white antialiased" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          Sample Itinerary
                        </h4>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareItinerary(city);
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
                    className="sample-itinerary-content text-left bg-white/90 rounded-lg p-6 border border-gray-300 antialiased text-gray-900"
                    dangerouslySetInnerHTML={{ __html: city.sampleItinerary }}
                    data-testid="sample-itinerary-content"
                  />
                </Collapsible.Content>
              </Collapsible.Root>
            </div>
          )}

          {/* Display all content cards */}
          <div className="max-w-4xl mx-auto">
            {content && content.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['morning', 'afternoon', 'evening', 'bonus', 'luxury', 'wildlife'].map(cardType => {
                  const cardContent = content.find((c: any) => c.cardType === cardType);
                  const displayContent = cardContent || {
                    id: `fallback-${cardType}`,
                    cardType,
                    title: `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} Discovery`,
                    content: `Discover amazing ${cardType} activities in ${city.name}.`,
                    imageUrl: null,
                    affiliateLinks: null,
                    createdAt: null,
                    updatedAt: null,
                    cityId: null
                  };
                  
                  return (
                    <CityCard
                      key={cardType}
                      content={displayContent}
                      city={city}
                      isCurrent={false}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-8">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Content Available</h3>
                    <p className="text-muted-foreground">
                      This city doesn't have any content cards yet.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Travel Booking Hub - Always visible */}
      <section className="py-16" style={{backgroundColor: '#f8f9fa'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* City-Specific CTAs - Show first when available */}
          {city?.cityCtaLinks && Array.isArray(city.cityCtaLinks) && city.cityCtaLinks.length > 0 && (
            <div className="mb-12">
              <div className="text-center mb-6">
                <h5 className="text-lg font-semibold">{city.name} Specials</h5>
                <p className="text-muted-foreground text-sm">City-specific recommendations and deals</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
                {city.cityCtaLinks.map((link: any, index: number) => (
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
            <h4 className="text-2xl font-bold mb-4">Ready to Explore {city.name}?</h4>
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