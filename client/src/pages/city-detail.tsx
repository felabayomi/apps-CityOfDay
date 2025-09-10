import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { CityCard } from "@/components/city-card";

export default function CityDetail() {
  const { id } = useParams<{ id: string }>();

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

  if (error || !data?.city) {
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

  const { city, content } = data;

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

      {/* City Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{city.name}</h1>
          <p className="text-xl text-muted-foreground">{city.country}</p>
          {city.scheduledDate && (
            <p className="text-sm text-accent mt-2">
              📅 Scheduled for: {new Date(city.scheduledDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Content Cards */}
        {content && content.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {content.map((card: any) => (
              <CityCard
                key={card.id}
                content={card}
                isPreview={true}
              />
            ))}
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
  );
}