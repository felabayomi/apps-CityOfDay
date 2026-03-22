import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, Eye, Sun, Utensils, Moon, Lightbulb, Globe, Trash2, Plus, Crown, Trees, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { CityContent } from "@shared/schema";

interface ContentEditorProps {
  selectedCityId?: string;
  onCityChange?: (cityId: string) => void;
}

const cardTypeConfig = {
  morning: {
    icon: Sun,
    label: "Morning",
    color: "bg-orange-100 text-orange-700",
    placeholder: "Morning inspiration and landmark content..."
  },
  afternoon: {
    icon: Utensils,
    label: "Afternoon", 
    color: "bg-secondary/10 text-secondary",
    placeholder: "Food, culture, and afternoon activities..."
  },
  evening: {
    icon: Moon,
    label: "Evening",
    color: "bg-destructive/10 text-destructive",
    placeholder: "Budget tips and evening recommendations..."
  },
  bonus: {
    icon: Lightbulb,
    label: "Fun Fact",
    color: "bg-primary/10 text-primary",
    placeholder: "Interesting facts and cultural insights..."
  },
  luxury: {
    icon: Crown,
    label: "Luxury",
    color: "bg-yellow-100 text-yellow-700",
    placeholder: "High-end experiences, luxury hotels, premium dining..."
  },
  wildlife: {
    icon: Trees,
    label: "Nature",
    color: "bg-green-100 text-green-700",
    placeholder: "Nature experiences, wildlife, parks, outdoor adventures..."
  },
};

interface ContentCardEditorProps {
  content: CityContent;
  onUpdate: (id: string, data: Partial<CityContent>) => void;
  isUpdating: boolean;
}

function ContentCardEditor({ content, onUpdate, isUpdating }: ContentCardEditorProps) {
  const [title, setTitle] = useState(content.title);
  const [contentText, setContentText] = useState(content.content);
  const [imageUrl, setImageUrl] = useState(content.imageUrl || "");
  const [hasChanges, setHasChanges] = useState(false);

  const config = cardTypeConfig[content.cardType as keyof typeof cardTypeConfig];
  if (!config) return null;

  const { icon: IconComponent, label, color, placeholder } = config;

  useEffect(() => {
    const changed = 
      title !== content.title ||
      contentText !== content.content ||
      imageUrl !== (content.imageUrl || "");
    setHasChanges(changed);
  }, [title, contentText, imageUrl, content]);

  const handleSave = () => {
    onUpdate(content.id, {
      title,
      content: contentText,
      imageUrl: imageUrl || null,
    });
    setHasChanges(false);
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <IconComponent className="w-4 h-4" />
          <h5 className="font-medium text-foreground">{label} Card</h5>
          <Badge className={color} data-testid={`badge-editor-${content.cardType}`}>
            {label}
          </Badge>
        </div>
        {hasChanges && (
          <Button 
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
            data-testid={`button-save-${content.cardType}`}
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <Label className="text-sm text-muted-foreground">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title..."
            className="bg-background text-sm"
            data-testid={`input-title-${content.cardType}`}
          />
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground">Image URL</Label>
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="bg-background text-sm"
            data-testid={`input-image-${content.cardType}`}
          />
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground">Content</Label>
          <Textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="bg-background text-sm resize-none"
            data-testid={`textarea-content-${content.cardType}`}
          />
        </div>
      </div>
    </div>
  );
}

export function ContentEditor({ selectedCityId, onCityChange }: ContentEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCtaLinks, setEditingCtaLinks] = useState<any[]>([]);
  const [editingHighlights, setEditingHighlights] = useState<string[]>([]);
  
  // Fetch all cities for selection
  const { data: cities } = useQuery({
    queryKey: ["/api/admin/cities"],
    retry: false,
  });

  // Fetch content for selected city
  const { data: cityData, isLoading: loadingContent } = useQuery({
    queryKey: ["/api/cities", selectedCityId],
    enabled: !!selectedCityId,
    retry: false,
    staleTime: 0, // Force fresh data fetch every time
    gcTime: 0, // Don't cache the data (v5 syntax)
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CityContent> }) => {
      await apiRequest("PUT", `/api/admin/content/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Content Updated",
        description: "Changes saved successfully.",
      });
      
      // Refresh the city content
      if (selectedCityId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cities", selectedCityId] });
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
        title: "Update Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update city mutation (for CTA links and city data)
  const updateCityMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      await apiRequest("PUT", `/api/admin/cities/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "City Updated",
        description: "City CTA buttons saved successfully.",
      });
      
      // Refresh the city data
      if (selectedCityId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cities", selectedCityId] });
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
        title: "Update Failed",
        description: "Failed to save CTA buttons. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Publish city mutation
  const publishCityMutation = useMutation({
    mutationFn: async (cityId: string) => {
      // Use dedicated publish endpoint
      await apiRequest("PUT", `/api/admin/cities/${cityId}/publish`, {});
    },
    onSuccess: () => {
      toast({
        title: "City Published",
        description: "City is now live and available to users.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cities/today"] });
      if (selectedCityId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cities", selectedCityId] });
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
        title: "Publish Failed",
        description: "Failed to publish city. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateContent = (id: string, data: Partial<CityContent>) => {
    updateContentMutation.mutate({ id, data });
  };

  const city = (cityData as any)?.city;
  const content = (cityData as any)?.content || [];

  // Update editing state when city changes
  useEffect(() => {
    if (city?.cityCtaLinks) {
      setEditingCtaLinks([...city.cityCtaLinks]);
    } else {
      setEditingCtaLinks([]);
    }
    if (city?.highlights && Array.isArray(city.highlights)) {
      setEditingHighlights([...city.highlights]);
    } else {
      setEditingHighlights(["", "", "", "", ""]);
    }
  }, [city]);

  return (
    <div className="w-full space-y-6" id="content-editor">
      <Card className={`postcard-shadow ${selectedCityId ? 'ring-2 ring-accent/50' : ''}`} data-testid="content-editor-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center">
            <Edit className="mr-3 text-secondary w-5 h-5" />
            Content Editor
            {selectedCityId && (
              <Badge className="ml-3 bg-blue-100 text-blue-700">
                Editing Mode Active
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* City Selection */}
        <div className="space-y-2">
          <Label className="text-foreground">Select City to Edit</Label>
          <Select 
            value={selectedCityId || ""} 
            onValueChange={onCityChange}
          >
            <SelectTrigger className="bg-background" data-testid="select-city-editor">
              <SelectValue placeholder="Choose a city to edit..." />
            </SelectTrigger>
            <SelectContent>
              {(cities as any)?.map((city: any) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}, {city.country} 
                  {city.isPublished ? " (Published)" : " (Draft)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Info */}
        {city && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <h4 className="font-semibold text-foreground">{city.name}, {city.country}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={city.isPublished ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                  {city.isPublished ? "Published" : "Draft"}
                </Badge>
                {city.isPinned && (
                  <Badge className="bg-secondary/10 text-secondary">Pinned</Badge>
                )}
              </div>
            </div>
            
            {!city.isPublished && (
              <Button 
                onClick={() => publishCityMutation.mutate(city.id)}
                disabled={publishCityMutation.isPending}
                data-testid="button-publish-city"
              >
                <Eye className="w-4 h-4 mr-2" />
                Publish Now
              </Button>
            )}
          </div>
        )}

        {/* Content Cards Editor */}
        {loadingContent ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : content.length > 0 ? (
          <div className="space-y-4">
            {content
              .sort((a: any, b: any) => {
                const order = { morning: 0, afternoon: 1, evening: 2, bonus: 3 };
                return order[a.cardType as keyof typeof order] - order[b.cardType as keyof typeof order];
              })
              .map((item: any) => (
                <ContentCardEditor
                  key={item.id}
                  content={item}
                  onUpdate={handleUpdateContent}
                  isUpdating={updateContentMutation.isPending}
                />
              ))}
          </div>
        ) : selectedCityId ? (
          <div className="text-center py-8 text-muted-foreground">
            <Edit className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No content found for this city.</p>
            <p className="text-sm">Generate content first using the AI generator.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Edit className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Select a city to start editing content.</p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* City Highlights Editor */}
    {city && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Sparkles className="mr-3 text-yellow-500 w-5 h-5" />
            City Highlights — {city.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">5 quick-scan facts shown in the hero section. Edit each line, then save.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {editingHighlights.map((highlight, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
              <Input
                value={highlight}
                onChange={(e) => {
                  const updated = [...editingHighlights];
                  updated[i] = e.target.value;
                  setEditingHighlights(updated);
                }}
                placeholder={`Highlight ${i + 1} — one crisp sentence about ${city.name}`}
                className="bg-background text-sm"
                data-testid={`input-highlight-${i}`}
              />
            </div>
          ))}
          <Button
            className="w-full mt-2"
            onClick={() => {
              const filtered = editingHighlights.filter(h => h.trim() !== "");
              updateCityMutation.mutate({ id: city.id, highlights: filtered });
            }}
            disabled={updateCityMutation.isPending}
            data-testid="button-save-highlights"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateCityMutation.isPending ? "Saving..." : "Save Highlights"}
          </Button>
        </CardContent>
      </Card>
    )}

    {/* City CTA Panel */}
    {city && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Globe className="mr-3 text-primary w-5 h-5" />
            City CTA Buttons - {city.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Customize the main action buttons that appear for this city (Book Hotels, Find Tours, etc.)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {editingCtaLinks.length > 0 ? 
              editingCtaLinks.map((link: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                  <div>
                    <Label htmlFor={`cta-text-${index}`}>Button Text</Label>
                    <Input
                      id={`cta-text-${index}`}
                      value={link.text || ""}
                      onChange={(e) => {
                        const newLinks = [...editingCtaLinks];
                        newLinks[index] = { ...newLinks[index], text: e.target.value };
                        setEditingCtaLinks(newLinks);
                      }}
                      placeholder={`e.g., Book ${city.name} Hotels`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`cta-url-${index}`}>URL</Label>
                    <Input
                      id={`cta-url-${index}`}
                      value={link.url || ""}
                      onChange={(e) => {
                        const newLinks = [...editingCtaLinks];
                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                        setEditingCtaLinks(newLinks);
                      }}
                      placeholder={`https://booking.com/${city.name.toLowerCase()}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newLinks = editingCtaLinks.filter((_: any, i: number) => i !== index);
                        setEditingCtaLinks(newLinks);
                        updateCityMutation.mutate({ 
                          id: city.id, 
                          cityCtaLinks: newLinks 
                        });
                      }}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )) : null
            }
            
            <Button
              variant="outline"
              onClick={() => {
                const newLinks = [...editingCtaLinks, { 
                  text: `Book ${city.name} Hotels`, 
                  url: `https://booking.com/${city.name.toLowerCase()}`, 
                  type: "booking" 
                }];
                setEditingCtaLinks(newLinks);
                updateCityMutation.mutate({ 
                  id: city.id, 
                  cityCtaLinks: newLinks 
                });
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add CTA Button
            </Button>
          </div>
          
          {editingCtaLinks.length > 0 && (
            <div className="pt-4 border-t space-y-3">
              <Button
                onClick={() => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    cityCtaLinks: editingCtaLinks 
                  });
                }}
                disabled={updateCityMutation.isPending}
                className="w-full"
              >
                {updateCityMutation.isPending ? "Saving..." : "Save CTA Changes"}
              </Button>
              
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Preview:</strong> These buttons will appear in the "Ready to Visit {city.name}?" section
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )}

    {/* Sample Itinerary HTML Panel */}
    {city && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <FileText className="mr-3 text-primary w-5 h-5" />
            Sample Itinerary HTML - {city.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Custom HTML content that will be displayed below "Today's Discovery Cards" with title "Sample Itinerary for {city.name}"
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sample-itinerary" className="text-foreground">HTML Content</Label>
            <Textarea
              id="sample-itinerary"
              value={city.sampleItinerary || ""}
              onChange={(e) => {
                updateCityMutation.mutate({ 
                  id: city.id, 
                  sampleItinerary: e.target.value 
                });
              }}
              placeholder="Enter custom HTML content for sample itinerary section..."
              className="bg-background min-h-[200px] font-mono text-sm"
              data-testid="textarea-sample-itinerary-editor"
            />
            <p className="text-xs text-muted-foreground">
              This HTML will be rendered on the city page. You can include any valid HTML elements.
            </p>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Content Card Affiliate Links Panel */}
    {city && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Lightbulb className="mr-3 text-primary w-5 h-5" />
            Content Card Affiliate Links - {city.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Set affiliate links for content card buttons (Explore Landmark, Find Cafés, Save Money, Learn More)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Morning Card Link */}
            <div className="space-y-2">
              <Label htmlFor="morning-link" className="flex items-center">
                <Sun className="w-4 h-4 mr-2 text-amber-600" />
                Morning - "Explore Landmark" Link
              </Label>
              <Input
                id="morning-link"
                value={city.morningCtaLink || ""}
                onChange={(e) => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    morningCtaLink: e.target.value 
                  });
                }}
                placeholder="https://example.com/landmarks"
              />
            </div>

            {/* Afternoon Card Link */}
            <div className="space-y-2">
              <Label htmlFor="afternoon-link" className="flex items-center">
                <Utensils className="w-4 h-4 mr-2 text-orange-600" />
                Afternoon - "Find Cafés" Link
              </Label>
              <Input
                id="afternoon-link"
                value={city.afternoonCtaLink || ""}
                onChange={(e) => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    afternoonCtaLink: e.target.value 
                  });
                }}
                placeholder="https://example.com/restaurants"
              />
            </div>

            {/* Evening Card Link */}
            <div className="space-y-2">
              <Label htmlFor="evening-link" className="flex items-center">
                <Moon className="w-4 h-4 mr-2 text-green-600" />
                Evening - "Save Money" Link
              </Label>
              <Input
                id="evening-link"
                value={city.eveningCtaLink || ""}
                onChange={(e) => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    eveningCtaLink: e.target.value 
                  });
                }}
                placeholder="https://example.com/deals"
              />
            </div>

            {/* Bonus Card Link */}
            <div className="space-y-2">
              <Label htmlFor="bonus-link" className="flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-purple-600" />
                Bonus - "Learn More" Link
              </Label>
              <Input
                id="bonus-link"
                value={city.bonusCtaLink || ""}
                onChange={(e) => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    bonusCtaLink: e.target.value 
                  });
                }}
                placeholder="https://example.com/info"
              />
            </div>

            {/* Luxury Card Link */}
            <div className="space-y-2">
              <Label htmlFor="luxury-link" className="flex items-center">
                <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                Luxury - "Book Experience" Link
              </Label>
              <Input
                id="luxury-link"
                value={city.luxuryCtaLink || ""}
                onChange={(e) => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    luxuryCtaLink: e.target.value 
                  });
                }}
                placeholder="https://example.com/luxury-hotels"
              />
            </div>

            {/* Wildlife Card Link */}
            <div className="space-y-2">
              <Label htmlFor="wildlife-link" className="flex items-center">
                <Trees className="w-4 h-4 mr-2 text-green-700" />
                Wildlife - "Explore Nature" Link
              </Label>
              <Input
                id="wildlife-link"
                value={city.wildlifeCtaLink || ""}
                onChange={(e) => {
                  updateCityMutation.mutate({ 
                    id: city.id, 
                    wildlifeCtaLink: e.target.value 
                  });
                }}
                placeholder="https://example.com/nature-tours"
              />
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> These links will be used when users click the content card buttons. Leave empty to disable clicking for that card type.
            </p>
          </div>
        </CardContent>
      </Card>
    )}
    </div>
  );
}
