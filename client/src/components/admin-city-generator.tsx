import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export function AdminCityGenerator() {
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [focus, setFocus] = useState("balanced");
  const [autoPublish, setAutoPublish] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [sampleItinerary, setSampleItinerary] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCityMutation = useMutation({
    mutationFn: async (data: { cityName: string; country: string; focus: string; autoPublish: boolean; scheduledDate?: string; sampleItinerary?: string }) => {
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
      setScheduledDate(undefined);
      setSampleItinerary("");

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
          window.location.href = "/auth";
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

    if (!cityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a city name.",
        variant: "destructive",
      });
      return;
    }

    if (!country.trim() && !cityName.includes(',')) {
      toast({
        title: "Missing Information",
        description: "Please enter a country or include state/region in city name (e.g., 'Asheville, North Carolina').",
        variant: "destructive",
      });
      return;
    }

    generateCityMutation.mutate({
      cityName: cityName.trim(),
      country: country.trim(),
      focus,
      autoPublish,
      scheduledDate: scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : undefined,
      sampleItinerary: sampleItinerary.trim() || undefined,
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
              placeholder="Enter city name (e.g., Tokyo or Asheville, North Carolina)"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="bg-background"
              data-testid="input-city-name"
            />
            <p className="text-xs text-muted-foreground">You can enter just the city name or include state/region</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-foreground">Country <span className="text-muted-foreground">(optional if city name includes state/region)</span></Label>
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
                <SelectItem value="luxury">Luxury Travel</SelectItem>
                <SelectItem value="nature">Nature & Wildlife</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sampleItinerary" className="text-foreground">Sample Itinerary HTML (Optional)</Label>
            <Textarea
              id="sampleItinerary"
              placeholder="Enter custom HTML content for sample itinerary section..."
              value={sampleItinerary}
              onChange={(e) => setSampleItinerary(e.target.value)}
              className="bg-background min-h-[120px]"
              data-testid="textarea-sample-itinerary"
            />
            <p className="text-xs text-muted-foreground">This HTML will be displayed below "Today's Discovery Cards" with the title "Sample Itinerary for [City Name]"</p>
          </div>

          {/* Scheduled Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date" className="text-sm font-medium">Scheduled Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                  data-testid="button-date-picker"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date to schedule content</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              Choose when this content should appear to users. Leave empty for manual publishing.
            </p>
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
