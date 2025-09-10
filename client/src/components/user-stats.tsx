import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface UserStatsProps {
  icon: LucideIcon;
  value: number;
  label: string;
  color?: "primary" | "secondary" | "accent" | "destructive";
}

const colorConfig = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary", 
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
};

export function UserStats({ 
  icon: IconComponent, 
  value, 
  label, 
  color = "primary" 
}: UserStatsProps) {
  const colorClass = colorConfig[color];
  
  return (
    <Card className="postcard-shadow text-center">
      <CardContent className="p-2 md:p-6">
        <div className={`w-8 h-8 md:w-16 md:h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-1 md:mb-4`}>
          <IconComponent className="w-4 h-4 md:w-6 md:h-6" />
        </div>
        <h4 
          className="text-lg md:text-2xl font-bold text-foreground mb-0.5 md:mb-2" 
          data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {value.toLocaleString()}
        </h4>
        <p className="text-muted-foreground text-xs md:text-sm leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
