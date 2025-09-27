import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Palette, Eye, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ColorTheme {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  heroGradientStart: string;
  heroGradientEnd: string;
  accentBarBackground: string;
  accentBarText: string;
  cardBadgeBackground: string;
  cardBadgeText: string;
  headerBackground: string;
  headerText: string;
  createdAt: string;
  updatedAt: string;
}

interface ColorThemeForm {
  name: string;
  description: string;
  heroGradientStart: string;
  heroGradientEnd: string;
  accentBarBackground: string;
  accentBarText: string;
  cardBadgeBackground: string;
  cardBadgeText: string;
  headerBackground: string;
  headerText: string;
}

const DEFAULT_FORM: ColorThemeForm = {
  name: "",
  description: "",
  heroGradientStart: "#0038A8",
  heroGradientEnd: "#008ED6",
  accentBarBackground: "#F2AF00",
  accentBarText: "#000000",
  cardBadgeBackground: "#0038A8",
  cardBadgeText: "#FFFFFF",
  headerBackground: "#002455",
  headerText: "#FFFFFF",
};

const THEME_PRESETS = {
  "Kansas City": {
    heroGradientStart: "#0038A8",
    heroGradientEnd: "#008ED6",
    accentBarBackground: "#F2AF00",
    accentBarText: "#000000",
    cardBadgeBackground: "#0038A8",
    cardBadgeText: "#FFFFFF",
    headerBackground: "#002455",
    headerText: "#FFFFFF",
  },
  "Ocean Blue": {
    heroGradientStart: "#1e3a8a",
    heroGradientEnd: "#3b82f6",
    accentBarBackground: "#0ea5e9",
    accentBarText: "#ffffff",
    cardBadgeBackground: "#1e40af",
    cardBadgeText: "#ffffff",
    headerBackground: "#1e293b",
    headerText: "#ffffff",
  },
  "Forest Green": {
    heroGradientStart: "#15803d",
    heroGradientEnd: "#22c55e",
    accentBarBackground: "#84cc16",
    accentBarText: "#000000",
    cardBadgeBackground: "#166534",
    cardBadgeText: "#ffffff",
    headerBackground: "#1f2937",
    headerText: "#ffffff",
  },
  "Sunset Orange": {
    heroGradientStart: "#ea580c",
    heroGradientEnd: "#f97316",
    accentBarBackground: "#fbbf24",
    accentBarText: "#000000",
    cardBadgeBackground: "#dc2626",
    cardBadgeText: "#ffffff",
    headerBackground: "#374151",
    headerText: "#ffffff",
  },
};

export function ColorThemeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ColorTheme | null>(null);
  const [formData, setFormData] = useState<ColorThemeForm>(DEFAULT_FORM);
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  // Fetch all color themes
  const { data: themes, isLoading } = useQuery<ColorTheme[]>({
    queryKey: ["/api/admin/color-themes"],
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (data: ColorThemeForm) => {
      return await apiRequest("POST", "/api/admin/color-themes", data);
    },
    onSuccess: () => {
      toast({
        title: "Theme Created",
        description: "Color theme has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/color-themes"] });
      setIsCreating(false);
      setFormData(DEFAULT_FORM);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create color theme.",
        variant: "destructive",
      });
    },
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ColorThemeForm> }) => {
      return await apiRequest("PUT", `/api/admin/color-themes/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Theme Updated",
        description: "Color theme has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/color-themes"] });
      setEditingTheme(null);
      setFormData(DEFAULT_FORM);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update color theme.",
        variant: "destructive",
      });
    },
  });

  // Activate theme mutation
  const activateThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PUT", `/api/admin/color-themes/${id}/activate`);
    },
    onSuccess: () => {
      toast({
        title: "Theme Activated",
        description: "Color theme is now active and will apply immediately.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/color-themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/color-themes/active"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate color theme.",
        variant: "destructive",
      });
    },
  });

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/color-themes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Theme Deleted",
        description: "Color theme has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/color-themes"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete color theme.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTheme) {
      updateThemeMutation.mutate({ id: editingTheme.id, data: formData });
    } else {
      createThemeMutation.mutate(formData);
    }
  };

  const startEdit = (theme: ColorTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || "",
      heroGradientStart: theme.heroGradientStart,
      heroGradientEnd: theme.heroGradientEnd,
      accentBarBackground: theme.accentBarBackground,
      accentBarText: theme.accentBarText,
      cardBadgeBackground: theme.cardBadgeBackground,
      cardBadgeText: theme.cardBadgeText,
      headerBackground: theme.headerBackground,
      headerText: theme.headerText,
    });
    setIsCreating(true);
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setEditingTheme(null);
    setFormData(DEFAULT_FORM);
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName as keyof typeof THEME_PRESETS];
    if (preset) {
      setFormData({ ...formData, ...preset });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Themes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Color Themes</h3>
          <Button
            onClick={() => setIsCreating(true)}
            data-testid="button-create-theme"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Theme
          </Button>
        </div>

{isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : themes && themes.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Browse and manage your color themes:</Label>
              <Badge variant="secondary" className="text-xs">
                {themes.length} theme{themes.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Set initial theme to active one or first theme
                    const activeIndex = themes.findIndex(t => t.isActive);
                    setCurrentThemeIndex(activeIndex >= 0 ? activeIndex : 0);
                    setIsModalOpen(true);
                  }}
                  data-testid="button-browse-themes"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse & Manage All Themes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Theme Gallery</span>
                    <Badge variant="secondary" className="text-xs">
                      {currentThemeIndex + 1} of {themes.length}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                
                {(() => {
                  const sortedThemes = themes.sort((a, b) => a.name.localeCompare(b.name));
                  const currentTheme = sortedThemes[currentThemeIndex];
                  if (!currentTheme) return null;

                  const goToPrevious = () => {
                    setCurrentThemeIndex(prev => prev > 0 ? prev - 1 : sortedThemes.length - 1);
                  };

                  const goToNext = () => {
                    setCurrentThemeIndex(prev => prev < sortedThemes.length - 1 ? prev + 1 : 0);
                  };
                  
                  return (
                    <div className="relative">
                      {/* Navigation Arrows */}
                      {sortedThemes.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                            data-testid="button-theme-previous"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                            data-testid="button-theme-next"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Theme Card */}
                      <Card className="relative mx-8">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{currentTheme.name}</CardTitle>
                            {currentTheme.isActive && (
                              <Badge variant="default" className="bg-green-100 text-green-700">
                                <Check className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          {currentTheme.description && (
                            <p className="text-sm text-muted-foreground">{currentTheme.description}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          {/* Color Preview */}
                          <div className="space-y-2 mb-6">
                            <div
                              className="h-10 rounded flex items-center justify-center text-white text-sm font-medium"
                              style={{
                                background: `linear-gradient(135deg, ${currentTheme.heroGradientStart}, ${currentTheme.heroGradientEnd})`,
                              }}
                            >
                              Hero Gradient
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div
                                className="h-8 rounded flex items-center justify-center text-xs font-medium"
                                style={{
                                  backgroundColor: currentTheme.accentBarBackground,
                                  color: currentTheme.accentBarText,
                                }}
                              >
                                Accent Bar
                              </div>
                              <div
                                className="h-8 rounded flex items-center justify-center text-xs font-medium"
                                style={{
                                  backgroundColor: currentTheme.cardBadgeBackground,
                                  color: currentTheme.cardBadgeText,
                                }}
                              >
                                Badge Colors
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-center gap-2">
                            {!currentTheme.isActive && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  activateThemeMutation.mutate(currentTheme.id);
                                }}
                                disabled={activateThemeMutation.isPending}
                                data-testid={`button-activate-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Activate This Theme
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                startEdit(currentTheme);
                                setIsModalOpen(false);
                              }}
                              data-testid={`button-edit-theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (window.confirm(`Delete theme "${currentTheme.name}"?`)) {
                                  deleteThemeMutation.mutate(currentTheme.id);
                                  setIsModalOpen(false);
                                }
                              }}
                              disabled={currentTheme.isActive || deleteThemeMutation.isPending}
                              data-testid={`button-delete-theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Theme Dots Indicator */}
                          {sortedThemes.length > 1 && (
                            <div className="flex justify-center gap-1 mt-4">
                              {sortedThemes.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentThemeIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    index === currentThemeIndex 
                                      ? 'bg-primary' 
                                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                  }`}
                                  data-testid={`button-theme-dot-${index}`}
                                />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No color themes created yet. Create your first theme!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              {editingTheme ? "Edit Theme" : "Create New Theme"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Theme Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Kansas City"
                    required
                    data-testid="input-theme-name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    data-testid="input-theme-description"
                  />
                </div>
              </div>

              {/* Presets */}
              <div>
                <Label>Quick Presets</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.keys(THEME_PRESETS).map((presetName) => (
                    <Button
                      key={presetName}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(presetName)}
                      data-testid={`button-preset-${presetName.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {presetName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Inputs */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Hero Gradient */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Hero Section Gradient</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="heroStart" className="text-xs">Start Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="heroStart"
                          value={formData.heroGradientStart}
                          onChange={(e) => setFormData({ ...formData, heroGradientStart: e.target.value })}
                          className="w-10 h-9 rounded border"
                          data-testid="color-hero-start"
                        />
                        <Input
                          value={formData.heroGradientStart}
                          onChange={(e) => setFormData({ ...formData, heroGradientStart: e.target.value })}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="heroEnd" className="text-xs">End Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="heroEnd"
                          value={formData.heroGradientEnd}
                          onChange={(e) => setFormData({ ...formData, heroGradientEnd: e.target.value })}
                          className="w-10 h-9 rounded border"
                          data-testid="color-hero-end"
                        />
                        <Input
                          value={formData.heroGradientEnd}
                          onChange={(e) => setFormData({ ...formData, heroGradientEnd: e.target.value })}
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Preview */}
                  <div
                    className="h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${formData.heroGradientStart}, ${formData.heroGradientEnd})`,
                    }}
                  >
                    Hero Preview
                  </div>
                </div>

                {/* Other Colors */}
                <div className="space-y-4">
                  {/* Accent Bar */}
                  <div>
                    <Label className="text-sm font-medium">Accent Bar Colors</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <Label htmlFor="accentBg" className="text-xs">Background</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="accentBg"
                            value={formData.accentBarBackground}
                            onChange={(e) => setFormData({ ...formData, accentBarBackground: e.target.value })}
                            className="w-8 h-8 rounded border"
                            data-testid="color-accent-bg"
                          />
                          <Input
                            value={formData.accentBarBackground}
                            onChange={(e) => setFormData({ ...formData, accentBarBackground: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="accentText" className="text-xs">Text</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="accentText"
                            value={formData.accentBarText}
                            onChange={(e) => setFormData({ ...formData, accentBarText: e.target.value })}
                            className="w-8 h-8 rounded border"
                            data-testid="color-accent-text"
                          />
                          <Input
                            value={formData.accentBarText}
                            onChange={(e) => setFormData({ ...formData, accentBarText: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="h-6 rounded flex items-center justify-center text-xs font-medium mt-2"
                      style={{
                        backgroundColor: formData.accentBarBackground,
                        color: formData.accentBarText,
                      }}
                    >
                      Accent Bar Preview
                    </div>
                  </div>

                  {/* Card Badge */}
                  <div>
                    <Label className="text-sm font-medium">Card Badge Colors</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <Label htmlFor="badgeBg" className="text-xs">Background</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="badgeBg"
                            value={formData.cardBadgeBackground}
                            onChange={(e) => setFormData({ ...formData, cardBadgeBackground: e.target.value })}
                            className="w-8 h-8 rounded border"
                            data-testid="color-badge-bg"
                          />
                          <Input
                            value={formData.cardBadgeBackground}
                            onChange={(e) => setFormData({ ...formData, cardBadgeBackground: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="badgeText" className="text-xs">Text</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="badgeText"
                            value={formData.cardBadgeText}
                            onChange={(e) => setFormData({ ...formData, cardBadgeText: e.target.value })}
                            className="w-8 h-8 rounded border"
                            data-testid="color-badge-text"
                          />
                          <Input
                            value={formData.cardBadgeText}
                            onChange={(e) => setFormData({ ...formData, cardBadgeText: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="h-6 rounded flex items-center justify-center text-xs font-medium mt-2"
                      style={{
                        backgroundColor: formData.cardBadgeBackground,
                        color: formData.cardBadgeText,
                      }}
                    >
                      Badge Preview
                    </div>
                  </div>

                  {/* Header */}
                  <div>
                    <Label className="text-sm font-medium">Header Colors</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <Label htmlFor="headerBg" className="text-xs">Background</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="headerBg"
                            value={formData.headerBackground}
                            onChange={(e) => setFormData({ ...formData, headerBackground: e.target.value })}
                            className="w-8 h-8 rounded border"
                            data-testid="color-header-bg"
                          />
                          <Input
                            value={formData.headerBackground}
                            onChange={(e) => setFormData({ ...formData, headerBackground: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="headerText" className="text-xs">Text</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="headerText"
                            value={formData.headerText}
                            onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                            className="w-8 h-8 rounded border"
                            data-testid="color-header-text"
                          />
                          <Input
                            value={formData.headerText}
                            onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className="h-6 rounded flex items-center justify-center text-xs font-medium mt-2"
                      style={{
                        backgroundColor: formData.headerBackground,
                        color: formData.headerText,
                      }}
                    >
                      Header Preview
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
                  data-testid="button-save-theme"
                >
                  {editingTheme ? "Update Theme" : "Create Theme"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  data-testid="button-cancel-theme"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}