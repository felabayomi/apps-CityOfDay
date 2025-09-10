import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, Eye, Sun, Utensils, Moon, Lightbulb } from "lucide-react";
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
    color: "bg-accent/10 text-accent",
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

  // Publish city mutation
  const publishCityMutation = useMutation({
    mutationFn: async (cityId: string) => {
      // Send current timestamp as string, backend will handle timezone conversion
      const publishedDate = new Date().toISOString();
      
      await apiRequest("PUT", `/api/admin/cities/${cityId}`, {
        isPublished: true,
        publishedDate: publishedDate,
      });
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

  return (
    <Card className={`postcard-shadow ${selectedCityId ? 'ring-2 ring-accent/50' : ''}`} data-testid="content-editor-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center">
            <Edit className="mr-3 text-secondary w-5 h-5" />
            Content Editor
            {selectedCityId && (
              <Badge className="ml-3 bg-accent/10 text-accent">
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
                <Badge className={city.isPublished ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}>
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
  );
}
