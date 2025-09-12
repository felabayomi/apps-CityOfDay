import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, ExternalLink, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  city: {
    name: string;
    country: string;
    morningShareTemplate?: string;
    afternoonShareTemplate?: string;
    eveningShareTemplate?: string;
    bonusShareTemplate?: string;
    luxuryShareTemplate?: string;
    wildlifeShareTemplate?: string;
  };
  content?: {
    title: string;
    content: string;
    card_type: string;
    image_url?: string;
  }[];
  shareType?: 'page' | 'card'; // Distinguish between page vs card sharing
}

export function ShareButton({ city, content, shareType = 'page' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Get the first image from morning content or fallback to any content with image
  const getShareImage = () => {
    if (!content || content.length === 0) return null;
    
    // Prefer morning content image
    const morningContent = content.find(c => c.card_type === 'morning');
    if (morningContent?.image_url) return morningContent.image_url;
    
    // Fallback to any content with image
    const anyContentWithImage = content.find(c => c.image_url);
    return anyContentWithImage?.image_url || null;
  };

  // Generate platform-specific content
  const generateContent = (platform: 'twitter' | 'facebook' | 'bluesky' | 'instagram' | 'copy') => {
    const isCardShare = shareType === 'card' && content && content.length === 1;
    
    // Generate baseText using your new format
    let baseText = '';
    if (isCardShare) {
      const cardType = content[0].card_type;
      baseText = `Check out this ${cardType} discovery in ${city.name}, ${city.country}! ✈️`;
    } else {
      baseText = `Wake up in ${city.name}, ${city.country}! ✈️`;
    }
    
    const hashtags = `#${city.name.replace(/\s+/g, '')} #Travel #CityDiscovery #CityDiscoverer`;
    const primaryUrl = `https://daily.citydiscoverer.guide`;
    const secondaryUrl = `https://cityoftheday.citydiscoverer.guide`;
    
    // Get content based on share type
    let fact = '';
    if (content && content.length > 0) {
      if (isCardShare) {
        // For single card: use that card's content
        const cardContent = content[0];
        const fullContent = cardContent.content;
        const firstSentence = fullContent.split('.')[0] + '.';
        fact = firstSentence.length < 150 ? firstSentence : fullContent.substring(0, 147) + '...';
      } else {
        // For full page: prefer bonus content or fallback to first content
        const factContent = content.find(c => c.card_type === 'bonus') || content[0];
        if (factContent) {
          const fullContent = factContent.content;
          const firstSentence = fullContent.split('.')[0] + '.';
          fact = firstSentence.length < 150 ? firstSentence : fullContent.substring(0, 147) + '...';
        }
      }
    }

    switch (platform) {
      case 'twitter':
        // TWITTER TEMPLATE (280 character limit)
        return `${baseText}\n\n${fact}\n\n${hashtags}\n\n${primaryUrl}\n${secondaryUrl}`;
      
      case 'facebook':
        // FACEBOOK TEMPLATE (No limit, more descriptive)
        const fbDescription = isCardShare 
          ? "Explore more discoveries at City Discoverer! 🌍"
          : "Discover amazing cities daily with City Discoverer! 🌍";
        return `${baseText}\n\n${fact}\n\n${fbDescription}\n\n${hashtags}\n\n${primaryUrl}\n${secondaryUrl}`;
      
      case 'bluesky':
        // BLUESKY TEMPLATE (300 character limit)
        return `${baseText}\n\n${fact}\n\n${hashtags}\n\n${primaryUrl}\n${secondaryUrl}`;
      
      case 'instagram':
        // INSTAGRAM TEMPLATE (Caption for image post)
        return `${baseText}\n\n${fact}\n\n${hashtags}\n\n${primaryUrl}\n${secondaryUrl}`;
      
      case 'copy':
        // COPY/GENERAL TEMPLATE (Clipboard text)
        const copyDescription = isCardShare 
          ? "Explore more discoveries at City Discoverer! 🌍"
          : "Discover amazing cities daily with City Discoverer! 🌍";
        return `${baseText}\n\n${fact}\n\n${copyDescription}\n\n${hashtags}\n\n${primaryUrl}\n${secondaryUrl}`;
      
      default:
        return `${baseText}\n\n${fact}\n\n${primaryUrl}\n${secondaryUrl}`;
    }
  };

  const shareToTwitter = () => {
    const text = generateContent('twitter');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const shareUrl = `https://daily.citydiscoverer.guide`;
    const content = generateContent('facebook');
    const hashtags = `#${city.name.replace(/\s+/g, '')} #Travel #CityDiscovery #CityDiscoverer`;
    const mainHashtag = hashtags.split(' ')[0].replace('#', ''); // First hashtag without #
    
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(content)}&hashtag=${encodeURIComponent('#' + mainHashtag)}`;
    window.open(url, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const shareToBluesky = () => {
    const text = generateContent('bluesky');
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToInstagram = () => {
    const imageUrl = getShareImage();
    const text = generateContent('instagram');
    
    // Always copy text to clipboard first
    copyToClipboard(text);
    
    if (imageUrl) {
      toast({
        title: "Content Ready for Instagram! 📱",
        description: "Caption copied! Right-click the image below to save it, then post both to Instagram.",
      });
      
      // Create a more helpful sharing experience
      setTimeout(() => {
        // Try to open Instagram on mobile, or Instagram web on desktop
        const userAgent = navigator.userAgent || navigator.vendor;
        const isMobile = /android|ipad|iphone|ipod/i.test(userAgent);
        
        if (isMobile) {
          // On mobile, try Instagram app first, then web as fallback
          try {
            window.location.href = 'instagram://camera';
          } catch (e) {
            window.open('https://www.instagram.com/', '_blank');
          }
        } else {
          // On desktop, open Instagram web
          window.open('https://www.instagram.com/accounts/login/', '_blank');
        }
      }, 1000);
    } else {
      toast({
        title: "Caption Copied! 📝",
        description: "Instagram caption is ready. Add your own photo when posting!",
      });
      
      // Still open Instagram even without image
      setTimeout(() => {
        const userAgent = navigator.userAgent || navigator.vendor;
        const isMobile = /android|ipad|iphone|ipod/i.test(userAgent);
        
        if (isMobile) {
          try {
            window.location.href = 'instagram://camera';
          } catch (e) {
            window.open('https://www.instagram.com/', '_blank');
          }
        } else {
          window.open('https://www.instagram.com/accounts/login/', '_blank');
        }
      }, 1000);
    }
  };

  const copyToClipboard = async (text?: string) => {
    const contentToCopy = text || generateContent('copy');
    
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white text-white hover:bg-white/10" size="sm" data-testid="button-share">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {shareType === 'card' && content && content.length === 1
              ? `Share ${content[0].card_type} discovery`
              : `Share ${city.name}`
            }
          </DialogTitle>
          <DialogClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 h-6 w-6"
              data-testid="button-close-dialog"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">
              {shareType === 'card' && content && content.length === 1
                ? (() => {
                    const cardType = content[0].card_type;
                    switch (cardType) {
                      case 'morning': return (city.morningShareTemplate || "Wake up in {CITY}! 🌄").replace('{CITY}', city.name);
                      case 'afternoon': return (city.afternoonShareTemplate || "Spend the afternoon in {CITY}! 🏙️").replace('{CITY}', city.name);
                      case 'evening': return (city.eveningShareTemplate || "Evening vibes in {CITY}! 🌆").replace('{CITY}', city.name);
                      case 'bonus': return (city.bonusShareTemplate || "Hidden gem in {CITY}! 💎").replace('{CITY}', city.name);
                      case 'luxury': return (city.luxuryShareTemplate || "Luxury awaits in {CITY}! ✨").replace('{CITY}', city.name);
                      case 'wildlife': return (city.wildlifeShareTemplate || "Wild side of {CITY}! 🦎").replace('{CITY}', city.name);
                      default: return `Discover ${city.name}! ✈️`;
                    }
                  })()
                : (city.morningShareTemplate || "Wake up in {CITY}! 🌄").replace('{CITY}', city.name)
              }
            </h4>
            {content && content.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {shareType === 'card' && content.length === 1
                  ? content[0].content.split('.')[0] + '...'
                  : (content.find(c => c.card_type === 'bonus') || content[0]).content.split('.')[0] + '...'
                }
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* X (Twitter) */}
            <Button
              variant="outline"
              onClick={shareToTwitter}
              className="flex items-center gap-2"
              data-testid="button-share-twitter"
            >
              <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center text-xs font-bold">
                𝕏
              </div>
              X
              <Badge variant="secondary" className="text-xs">280</Badge>
            </Button>

            {/* Facebook */}
            <Button
              variant="outline"
              onClick={shareToFacebook}
              className="flex items-center gap-2"
              data-testid="button-share-facebook"
            >
              <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold">
                f
              </div>
              Facebook
            </Button>

            {/* Bluesky */}
            <Button
              variant="outline"
              onClick={shareToBluesky}
              className="flex items-center gap-2"
              data-testid="button-share-bluesky"
            >
              <div className="w-5 h-5 bg-sky-500 text-white rounded flex items-center justify-center text-xs">
                🦋
              </div>
              Bluesky
              <Badge variant="secondary" className="text-xs">300</Badge>
            </Button>

            {/* Instagram */}
            <Button
              variant="outline"
              onClick={shareToInstagram}
              className="flex items-center gap-2"
              data-testid="button-share-instagram"
              disabled={!getShareImage()}
            >
              <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded flex items-center justify-center text-xs">
                📷
              </div>
              Instagram
              {getShareImage() && <Badge variant="secondary" className="text-xs">IMG</Badge>}
            </Button>
          </div>

          {/* Copy Text */}
          <Button
            variant="outline"
            onClick={() => copyToClipboard()}
            className="w-full flex items-center gap-2"
            data-testid="button-copy-text"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Text'}
          </Button>

          {getShareImage() && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                📱 For Instagram: Save image below
              </p>
              <img 
                src={getShareImage()!} 
                alt={`${city.name} share image`}
                className="w-32 h-20 object-cover rounded mx-auto cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors"
                title="Save image for Instagram"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}