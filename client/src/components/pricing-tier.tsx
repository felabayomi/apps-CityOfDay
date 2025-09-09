import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Loader2 } from "lucide-react";

interface PricingTierProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant?: "default" | "secondary" | "outline";
  buttonAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PricingTier({
  title,
  price,
  description,
  features,
  limitations = [],
  popular = false,
  buttonText,
  buttonVariant = "default",
  buttonAction,
  disabled = false,
  loading = false,
  ...props
}: PricingTierProps) {
  return (
    <Card className={`postcard-shadow hover:transform hover:scale-105 transition-all duration-300 relative ${popular ? 'border-2 border-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Crown className="w-3 h-3 mr-1" />
            MOST POPULAR
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl text-foreground mb-2">{title}</CardTitle>
        <div className={`text-3xl font-bold mb-4 ${popular ? 'text-primary' : 'text-foreground'}`}>
          {price}
          <span className="text-base text-muted-foreground font-normal">/month</span>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
          
          {limitations.map((limitation, index) => (
            <div key={index} className="flex items-start space-x-3 opacity-50">
              <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{limitation}</span>
            </div>
          ))}
        </div>
        
        <Button 
          className="w-full"
          variant={buttonVariant}
          onClick={buttonAction}
          disabled={disabled || loading}
          data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}-plan`}
          {...props}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            buttonText
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
