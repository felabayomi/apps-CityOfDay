import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export function AdminCityGenerator() {
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [focus, setFocus] = useState("balanced");
  const [autoPublish, setAutoPublish] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCityMutation = useMutation({
    mutationFn: async (data: { cityName: string; country: string; focus: string; autoPublish: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/cities/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "City Generated Successfully!",
        description: `Created content for ${data.city.name}, ${data.city.country}`,
      });
      
      // Reset form
      setCityName("");
      setCountry("");
      setFocus("balanced");
      setAutoPublish(false);
      
      // Refresh cities list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      
      if (autoPublish) {
        queryClient.invalidateQueries({ queryKey: ["/api/cities/today"] });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Generation Failed",
        description: (error as Error).message || "Failed to generate city content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityName.trim() || !country.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both city name and country.",
        variant: "destructive",
      });
      return;
    }

    generateCityMutation.mutate({
      cityName: cityName.trim(),
      country: country.trim(),
      focus,
      autoPublish,
    });
  };

  return (
    <Card className="postcard-shadow">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Wand2 className="mr-3 text-accent w-5 h-5" />
          AI City Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cityName" className="text-foreground">City Name</Label>
            <Input
              id="cityName"
              type="text"
              placeholder="Enter city name (e.g., Tokyo, New York)"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="bg-background"
              data-testid="input-city-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country" className="text-foreground">Country</Label>
            <Input
              id="country"
              type="text"
              placeholder="Enter country (e.g., Japan, United States)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-background"
              data-testid="input-country"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="focus" className="text-foreground">Content Focus</Label>
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger id="focus" className="bg-background" data-testid="select-content-focus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced (All topics)</SelectItem>
                <SelectItem value="cultural">Cultural Heritage</SelectItem>
                <SelectItem value="food">Food & Cuisine</SelectItem>
                <SelectItem value="architecture">Architecture & Landmarks</SelectItem>
                <SelectItem value="budget">Budget Travel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="autoPublish" 
              checked={autoPublish}
              onCheckedChange={(checked) => setAutoPublish(checked as boolean)}
              data-testid="checkbox-auto-publish"
            />
            <Label htmlFor="autoPublish" className="text-sm text-muted-foreground">
              Auto-publish after generation
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={generateCityMutation.isPending}
            data-testid="button-generate-content"
          >
            {generateCityMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Content with AI
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
