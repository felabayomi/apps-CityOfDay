import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Sun, Utensils, Moon, Lightbulb, Globe, ChevronDown, ChevronUp, Clock, Share2, Crown, Trees } from "lucide-react";
import type { CityContent } from "@shared/schema";
import { useState, useEffect } from "react";
import { getNextCardType, formatTimeUntilNext } from "@/lib/timeBasedContent";
import { ShareButton } from "@/components/ShareButton";

interface CityCardProps {
  content: CityContent;
  city?: any; // City data with affiliate links
  onCollect?: () => void;
  onAddToBucketList?: () => void;
  isCollecting?: boolean;
  isAddingToBucketList?: boolean;
  isPreview?: boolean;
  nextCardTitle?: string;
  timeUntilNext?: string;
  isCurrent?: boolean;
}

const cardTypeConfig = {
  morning: {
    icon: Sun,
    badge: "Morning",
    color: "text-white",
    buttonText: "Explore Landmark",
    buttonColor: "text-amber-600 hover:text-amber-700",
  },
  afternoon: {
    icon: Utensils,
    badge: "Afternoon", 
    color: "text-white",
    buttonText: "Find Cafés",
    buttonColor: "text-orange-600 hover:text-orange-700",
  },
  evening: {
    icon: Moon,
    badge: "Evening",
    color: "text-white",
    buttonText: "Explore Evening", 
    buttonColor: "text-purple-600 hover:text-purple-700",
  },
  bonus: {
    icon: Lightbulb,
    badge: "Fun Fact",
    color: "text-white",
    buttonText: "Learn More",
    buttonColor: "text-purple-600 hover:text-purple-700",
  },
  luxury: {
    icon: Crown,
    badge: "Luxury",
    color: "text-white",
    buttonText: "Book Luxury",
    buttonColor: "text-yellow-600 hover:text-yellow-700",
  },
  wildlife: {
    icon: Trees,
    badge: "Nature",
    color: "text-white",
    buttonText: "Explore Nature",
    buttonColor: "text-green-600 hover:text-green-700",
  },
};

export function CityCard({ 
  content, 
  city,
  onCollect, 
  onAddToBucketList, 
  isCollecting = false,
  isAddingToBucketList = false,
  isPreview = false,
  nextCardTitle,
  timeUntilNext,
  isCurrent = false
}: CityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const config = cardTypeConfig[content.cardType as keyof typeof cardTypeConfig];
  if (!config) return null;

  const { icon: IconComponent, badge, color, buttonText, buttonColor } = config;
  
  // Check if content is long enough to need truncation
  const contentLength = content.content.length;
  const shouldShowReadMore = contentLength > 200; // Show "Read More" if content is longer than 200 chars

  return (
    <Card className={`postcard-shadow hover:transform hover:scale-105 transition-all duration-300 relative ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {isCurrent && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-primary text-primary-foreground animate-pulse" data-testid={`badge-current-${content.cardType}`}>
            <Clock className="w-3 h-3 mr-1" />
            Current
          </Badge>
        </div>
      )}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
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
        
        <Badge 
          className={`absolute top-4 left-4 ${color}`}
          style={{
            backgroundColor: content.cardType === 'morning' || content.cardType === 'afternoon' || content.cardType === 'bonus' ? '#0033A0' : '#C8102E'
          }}
          data-testid={`badge-${content.cardType}`}
        >
          <IconComponent className="w-3 h-3 mr-1" />
          {badge}
        </Badge>
        
        {/* Individual Share Button for this card */}
        {city && (
          <div className="absolute top-4 right-4">
            <ShareButton 
              city={{ name: city.name, country: city.country }}
              content={[{
                title: content.title,
                content: content.content,
                card_type: content.cardType,
                image_url: content.imageUrl || undefined
              }]}
              shareType="card"
            />
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <h4 className="text-lg font-semibold text-foreground mb-2" data-testid={`title-${content.cardType}`}>
          {content.title}
        </h4>
        <div className="mb-4">
          <p className={`text-foreground/80 text-sm ${!isExpanded && shouldShowReadMore ? 'line-clamp-3' : ''}`} data-testid={`content-${content.cardType}`}>
            {content.content}
          </p>
          {shouldShowReadMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 p-0 h-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
              data-testid={`button-read-more-${content.cardType}`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Read Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Read More
                </>
              )}
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${buttonColor} hover:bg-accent/10 font-medium`}
            data-testid={`button-${content.cardType}-action`}
            onClick={() => {
              if (city) {
                let affiliateLink = '';
                switch(content.cardType) {
                  case 'morning':
                    affiliateLink = city.morningCtaLink;
                    break;
                  case 'afternoon':
                    affiliateLink = city.afternoonCtaLink;
                    break;
                  case 'evening':
                    affiliateLink = city.eveningCtaLink;
                    break;
                  case 'bonus':
                    affiliateLink = city.bonusCtaLink;
                    break;
                  case 'luxury':
                    affiliateLink = city.luxuryCtaLink;
                    break;
                  case 'wildlife':
                    affiliateLink = city.wildlifeCtaLink;
                    break;
                }
                if (affiliateLink) {
                  window.open(affiliateLink, '_blank');
                }
              }
            }}
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
        {content.affiliateLinks && Array.isArray(content.affiliateLinks) && content.affiliateLinks.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {content.affiliateLinks.map((link: { url: string; text: string }, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open(link.url, '_blank')}
                  data-testid={`affiliate-link-${index}`}
                >
                  {link.text as string}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      
      {/* Next Content Footer */}
      {(nextCardTitle || timeUntilNext) && (
        <div className="mx-6 mb-6 bg-muted/50 rounded-lg px-4 py-3 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground text-sm">Next:</div>
              <div className="text-foreground font-medium text-sm">{nextCardTitle || "Next Card"}</div>
            </div>
            <div className="text-foreground font-semibold text-sm">
              in {timeUntilNext || "Loading..."}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
