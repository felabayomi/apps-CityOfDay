import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  city: {
    name: string;
    country: string;
  };
  content?: {
    title: string;
    content: string;
    card_type: string;
    image_url?: string;
  }[];
}

export function ShareButton({ city, content }: ShareButtonProps) {
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
    const baseText = `Wake up in ${city.name}, ${city.country}! ✈️`;
    const hashtags = `#${city.name.replace(/\s+/g, '')} #Travel #CityDiscovery #DailyFelix`;
    const url = `${window.location.origin}/cities/${encodeURIComponent(city.name)}`;
    
    // Get interesting fact from content
    let fact = '';
    if (content && content.length > 0) {
      const factContent = content.find(c => c.card_type === 'bonus') || content[0];
      if (factContent) {
        // Extract first sentence or shorten content
        const fullContent = factContent.content;
        const firstSentence = fullContent.split('.')[0] + '.';
        fact = firstSentence.length < 150 ? firstSentence : fullContent.substring(0, 147) + '...';
      }
    }

    switch (platform) {
      case 'twitter':
        // Twitter: 280 characters
        const twitterText = `${baseText}\n\n${fact}\n\n${hashtags}\n\n${url}`;
        return twitterText.length <= 280 ? twitterText : 
          `${baseText}\n\n${fact.substring(0, 200 - baseText.length - hashtags.length - url.length - 10)}...\n\n${hashtags}\n\n${url}`;
      
      case 'facebook':
        // Facebook: No strict limit, more descriptive
        return `${baseText}\n\n${fact}\n\nDiscover amazing cities daily with Daily Felix! 🌍\n\n${hashtags}\n\n${url}`;
      
      case 'bluesky':
        // Bluesky: 300 characters
        const blueskyText = `${baseText}\n\n${fact}\n\n${hashtags}\n\n${url}`;
        return blueskyText.length <= 300 ? blueskyText :
          `${baseText}\n\n${fact.substring(0, 220 - baseText.length - hashtags.length - url.length - 10)}...\n\n${hashtags}\n\n${url}`;
      
      case 'instagram':
        // Instagram: Caption for image post
        return `${baseText}\n\n${fact}\n\n${hashtags}`;
      
      case 'copy':
        return `${baseText}\n\n${fact}\n\nDiscover amazing cities daily with Daily Felix! 🌍\n\n${hashtags}\n\n${url}`;
      
      default:
        return `${baseText}\n\n${fact}\n\n${url}`;
    }
  };

  const shareToTwitter = () => {
    const text = generateContent('twitter');
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const text = generateContent('facebook');
    const shareUrl = `${window.location.origin}/cities/${encodeURIComponent(city.name)}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToBluesky = () => {
    const text = generateContent('bluesky');
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToInstagram = () => {
    const imageUrl = getShareImage();
    const text = generateContent('instagram');
    
    if (imageUrl) {
      // Instagram doesn't have a direct URL scheme for posting with image and text
      // Best we can do is open Instagram app/web and copy text to clipboard
      copyToClipboard(text);
      toast({
        title: "Text Copied!",
        description: "Instagram caption copied to clipboard. Open Instagram to post with your image!",
      });
      
      // Try to open Instagram app (works on mobile)
      const userAgent = navigator.userAgent || navigator.vendor;
      if (/android/i.test(userAgent)) {
        window.location.href = 'intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end';
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        window.location.href = 'instagram://';
      } else {
        window.open('https://www.instagram.com/', '_blank');
      }
    } else {
      toast({
        title: "No Image Available",
        description: "This city doesn't have an image to share to Instagram yet.",
        variant: "destructive",
      });
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
          <DialogTitle>Share {city.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Wake up in {city.name}, {city.country}! ✈️</h4>
            {content && content.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {content[0].content.split('.')[0]}...
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
              <p className="text-xs text-muted-foreground mb-2">Share Image:</p>
              <img 
                src={getShareImage()!} 
                alt={`${city.name} share image`}
                className="w-20 h-12 object-cover rounded mx-auto"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}