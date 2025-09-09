import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Sun, Utensils, Moon, Lightbulb, Globe } from "lucide-react";
import type { CityContent } from "@shared/schema";

interface CityCardProps {
  content: CityContent;
  onCollect?: () => void;
  onAddToBucketList?: () => void;
  isCollecting?: boolean;
  isAddingToBucketList?: boolean;
  isPreview?: boolean;
}

const cardTypeConfig = {
  morning: {
    icon: Sun,
    badge: "Morning",
    color: "bg-accent text-accent-foreground",
    buttonText: "Explore Landmark",
    buttonColor: "text-accent",
  },
  afternoon: {
    icon: Utensils,
    badge: "Afternoon", 
    color: "bg-secondary text-secondary-foreground",
    buttonText: "Find Cafés",
    buttonColor: "text-secondary",
  },
  evening: {
    icon: Moon,
    badge: "Evening",
    color: "bg-destructive text-destructive-foreground",
    buttonText: "Save Money", 
    buttonColor: "text-destructive",
  },
  bonus: {
    icon: Lightbulb,
    badge: "Fun Fact",
    color: "bg-primary text-primary-foreground",
    buttonText: "Learn More",
    buttonColor: "text-primary",
  },
};

export function CityCard({ 
  content, 
  onCollect, 
  onAddToBucketList, 
  isCollecting = false,
  isAddingToBucketList = false 
}: CityCardProps) {
  const config = cardTypeConfig[content.cardType as keyof typeof cardTypeConfig];
  if (!config) return null;

  const { icon: IconComponent, badge, color, buttonText, buttonColor } = config;

  return (
    <Card className="postcard-shadow hover:transform hover:scale-105 transition-all duration-300">
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        {content.imageUrl ? (
          <img 
            src={content.imageUrl} 
            alt={content.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to gradient background if image fails
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback gradient background */}
        <div className={`w-full h-full bg-gradient-to-br from-${content.cardType === 'morning' ? 'accent' : content.cardType === 'afternoon' ? 'secondary' : content.cardType === 'evening' ? 'destructive' : 'primary'}/20 to-primary/20 flex items-center justify-center ${content.imageUrl ? 'absolute inset-0 opacity-0' : ''}`}>
          <Globe className="w-16 h-16 text-primary opacity-50" />
        </div>
        
        <Badge className={`absolute top-4 left-4 ${color}`} data-testid={`badge-${content.cardType}`}>
          <IconComponent className="w-3 h-3 mr-1" />
          {badge}
        </Badge>
      </div>
      
      <CardContent className="p-6">
        <h4 className="text-lg font-semibold text-foreground mb-2" data-testid={`title-${content.cardType}`}>
          {content.title}
        </h4>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`content-${content.cardType}`}>
          {content.content}
        </p>
        
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${buttonColor} hover:bg-transparent`}
            data-testid={`button-${content.cardType}-action`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
          
          {(onCollect || onAddToBucketList) && (
            <div className="flex space-x-2">
              {onAddToBucketList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddToBucketList}
                  disabled={isAddingToBucketList}
                  data-testid={`button-bucket-list-${content.cardType}`}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              )}
              {onCollect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCollect}
                  disabled={isCollecting}
                  data-testid={`button-collect-${content.cardType}`}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Affiliate links if present */}
        {content.affiliateLinks && Array.isArray(content.affiliateLinks) && content.affiliateLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {content.affiliateLinks.map((link: any, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open(link.url, '_blank')}
                  data-testid={`affiliate-link-${index}`}
                >
                  {link.text}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
