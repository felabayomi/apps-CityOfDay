import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, ChevronDown, ChevronRight, Share2 } from "lucide-react";
import { Link } from "wouter";
import { CityCard } from "@/components/city-card";
import Footer from "@/components/Footer";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
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

  // Get timezone offset for accurate city scheduling
  const tzOffset = -new Date().getTimezoneOffset(); // Convert to minutes east of UTC
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/cities/today`, tzOffset],
    queryFn: () => 
      fetch(`/api/cities/today?tzOffset=${tzOffset}`)
        .then(res => res.json()),
    retry: false,
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
          <p className="text-muted-foreground mb-6">No city available for today.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Landing
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
          <div className="logo-icon">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">Daily Felix</span>
          <span className="tagline">City Explorer</span>
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

      {/* Hero Section - Full layout like city detail page */}
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
                        <h4 className="text-lg font-bold text-center">
                          <span className="hidden md:inline">Sample Itinerary for {city.name}</span>
                          <span className="md:hidden">Sample Itinerary</span>
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
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-white">
                <p>Loading content...</p>
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}