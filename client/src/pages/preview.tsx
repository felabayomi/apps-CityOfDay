import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Bell, Heart, Flame, MapPin, LogIn } from "lucide-react";
import { CityCard } from "@/components/city-card";
import Footer from "@/components/Footer";

export default function Preview() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  // Sample preview data - showing what daily content looks like
  const sampleCity = {
    id: "preview-paris",
    name: "Paris",
    country: "France",
    description: "The City of Light awaits your discovery",
    imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=400&fit=crop"
  };

  const sampleContent = [
    {
      id: "1",
      timeOfDay: "morning",
      title: "Eiffel Tower at Sunrise",
      description: "Start your Parisian adventure with the iconic Eiffel Tower bathed in golden morning light. Best viewing spots and insider photography tips included.",
      imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop",
      contentType: "landmark"
    },
    {
      id: "2", 
      timeOfDay: "afternoon",
      title: "Café Culture & Croissants",
      description: "Discover authentic Parisian café culture and the best spots for fresh croissants. Learn the local etiquette and hidden neighborhood gems.",
      imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop",
      contentType: "food"
    },
    {
      id: "3",
      timeOfDay: "evening", 
      title: "Seine River Walk",
      description: "End your day with a romantic stroll along the Seine. Budget-friendly evening activities and free entertainment options.",
      imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop",
      contentType: "budget"
    },
    {
      id: "4",
      timeOfDay: "bonus",
      title: "Napoleon's Secret Passages",
      description: "Did you know? The Louvre contains secret passages used by Napoleon. Discover hidden historical facts about Paris's imperial past.",
      imageUrl: "https://images.unsplash.com/photo-1566139992631-c6e3d3eca8ed?w=400&h=300&fit=crop",
      contentType: "history"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Preview Banner */}
      <header className="site-header border-b border-orange-200">
        <div className="logo-area">
          <div className="logo-icon">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">Daily Felix</span>
          <span className="tagline">City of the Day™</span>
        </div>
        <div className="auth-area">
          <Badge variant="outline" className="mr-4 border-orange-500 text-orange-600">
            🎯 Preview Mode
          </Badge>
          <Button onClick={handleSignIn} data-testid="button-sign-in-preview">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In for Full Access
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Preview Notice */}
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                  Welcome to Daily Felix Preview! ✨
                </h3>
                <p className="text-orange-700 mb-3">
                  You're viewing a sample of today's city content. Sign in to access the full experience with personalized content, collections, and daily updates.
                </p>
                <Button 
                  onClick={handleSignIn} 
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-join-from-preview"
                >
                  Join Daily Felix
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* City Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img 
                src={sampleCity.imageUrl} 
                alt={sampleCity.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{sampleCity.name}</h1>
              <p className="text-muted-foreground">{sampleCity.country}</p>
              <p className="text-sm text-muted-foreground mt-1">{sampleCity.description}</p>
            </div>
            <div className="ml-auto text-center">
              <Button variant="outline" disabled className="opacity-50">
                <Heart className="w-4 h-4 mr-2" />
                Collect City
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Sign in to collect</p>
            </div>
          </div>
        </div>

        {/* Sample Content Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {sampleContent.map((content) => (
            <CityCard 
              key={content.id}
              content={content}
              isPreview={true}
            />
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-travel text-white border-none">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready for Daily Adventures?</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              This is just a taste! Join Daily Felix to get fresh city content every day, build your travel collection, and discover your next adventure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={handleSignIn}
                data-testid="button-start-journey-preview"
              >
                Start Your Daily Journey
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => window.scrollTo(0, 0)}
              >
                View Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}