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
    id: "preview-asheville",
    name: "Asheville",
    country: "North Carolina",
    description: "Where arts, mountains, and craft beer meet",
    imageUrl: "https://res.cloudinary.com/do26xsbby/image/upload/c_pad,b_gen_fill,ar_16:9/v1757465789/ChatGPT_Image_Sep_9_2025_08_50_33_PM_m28hyj.png"
  };

  const sampleContent = [
    {
      id: "1",
      timeOfDay: "morning",
      title: "Wake up in Asheville, North Carolina",
      description: "Sunrise spills across the Blue Ridge as you step onto the esplanade of the Biltmore Estate, Asheville's crown jewel. The limestone façade warms to peach, and cool air from the Italian Garden carries the scent of roses and herbs.",
      imageUrl: "https://res.cloudinary.com/do26xsbby/image/upload/c_pad,b_gen_fill,ar_16:9/v1757465789/ChatGPT_Image_Sep_9_2025_08_50_33_PM_m28hyj.png",
      contentType: "landmark"
    },
    {
      id: "2", 
      timeOfDay: "afternoon",
      title: "Taste of Asheville, North Carolina",
      description: "Order Appalachian rainbow trout and grits—a plate that tastes like these mountains. Crisp-skinned local Sunburst trout meets creamy, stone-ground grits, often brightened with lemon, ramps, or a brown-butter drizzle.",
      imageUrl: "https://res.cloudinary.com/do26xsbby/image/upload/c_pad,b_gen_fill,ar_16:9/v1757467566/ChatGPT_Image_Sep_9_2025_09_25_48_PM_dkdudx.png",
      contentType: "food"
    },
    {
      id: "3",
      timeOfDay: "evening", 
      title: "Budget Smart",
      description: "Trade pricey rooftop tabs for a golden-hour picnic with million-dollar views—free. Swing by French Broad Food Co‑op or a local market for baguette, local cheese, cured meats, and seasonal fruit (about $12–15 per person).",
      imageUrl: "https://res.cloudinary.com/do26xsbby/image/upload/c_pad,b_gen_fill,ar_16:9/v1757467315/ChatGPT_Image_Sep_9_2025_09_21_34_PM_tyqetu.png",
      contentType: "budget"
    },
    {
      id: "4",
      timeOfDay: "bonus",
      title: "Did You Know?",
      description: "American forestry took root in Asheville. George Vanderbilt hired Gifford Pinchot—and later Dr. Carl A. Schenck—at Biltmore, where Schenck founded the Biltmore Forest School in 1898, the first forestry school in the United States.",
      imageUrl: "https://res.cloudinary.com/do26xsbby/image/upload/c_pad,b_gen_fill,ar_16:9/v1757466906/ChatGPT_Image_Sep_9_2025_09_13_16_PM_b6pojb.png",
      contentType: "history"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Preview Banner */}
      <header className="site-header border-b border-orange-200">
        <div className="logo-area">
          <img src="/city-discoverer-logo-nobg.png" alt="City Discoverer" className="h-32 w-auto" />
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
                  Welcome to City Discoverer Preview! ✨
                </h3>
                <p className="text-orange-700 mb-3">
                  You're viewing a sample of today's city content. Sign in to access the full experience with personalized content, collections, and daily updates.
                </p>
                <Button 
                  onClick={() => window.open("https://citydiscoverer.ai/subscribe", "_blank")}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-join-from-preview"
                >
                  Join City Discoverer
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
              This is just a taste! Join City Discoverer to get fresh city content every day, build your travel collection, and discover your next adventure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={handleSignIn}
                data-testid="button-start-journey-preview"
              >
                Start Your Daily Discovery
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