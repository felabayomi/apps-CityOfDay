import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Globe, Wand2, Edit, Trash2, Plus, Eye, MapPin, CalendarIcon, ChevronDown, ChevronRight } from "lucide-react";
import { AdminCityGenerator } from "@/components/admin-city-generator";
import { ContentEditor } from "@/components/content-editor";
import { ColorThemeManager } from "@/components/ColorThemeManager";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import Footer from "@/components/Footer";

export default function Admin() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [openLetters, setOpenLetters] = useState<Set<string>>(new Set());

  // Redirect to login if not authenticated or check admin access
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
    
    // Check admin access using server-provided isAdmin flag
    if (user && !(user as any)?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch all cities for admin
  const { data: cities, isLoading: loadingCities } = useQuery<any[]>({
    queryKey: ["/api/admin/cities"],
    retry: false,
    enabled: !!user,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Delete city mutation
  const deleteCityMutation = useMutation({
    mutationFn: async (cityId: string) => {
      await fetch(`/api/admin/cities/${cityId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      toast({
        title: "City Deleted",
        description: "City and all its content have been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      // Clear selected city if it was the deleted one
      if (selectedCity) {
        setSelectedCity("");
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
        title: "Delete Failed",
        description: "Failed to delete city. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="site-header">
        <div className="logo-area">
          <div className="logo-icon">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">Daily Felix</span>
          <span className="tagline">Admin Panel</span>
        </div>
        <nav className="nav-links">
          <a href="/">Home</a>
          <a href="#cities">Cities</a>
          <a href="#calendar">Calendar</a>
          <a href="#generate">Generate</a>
        </nav>
        <div className="auth-area">
          <div className="user-section">
            <span className="welcome-text">Admin: {(user as any).firstName || 'User'}</span>
            <button className="sign-in-btn" onClick={handleLogout} data-testid="button-admin-logout">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Admin Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">Content Management Dashboard</h2>
          <p className="text-xl text-muted-foreground">Generate and manage your daily city content</p>
        </div>

        {/* Color Theme Management */}
        <div id="color-themes" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <div className="w-5 h-5 mr-3 rounded bg-gradient-to-r from-primary to-accent"></div>
                Color Theme Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorThemeManager />
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* City Generator */}
          <div id="generate">
            <AdminCityGenerator />
          </div>

          {/* Content Editor */}
          <div>
            <ContentEditor 
              selectedCityId={selectedCity}
              onCityChange={setSelectedCity}
            />
          </div>
        </div>

        {/* Content Calendar */}
        <div id="calendar" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <CalendarIcon className="mr-3 text-accent w-5 h-5" />
                Content Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cities && cities.length > 0 ? (
                <div className="space-y-2">
                  {(() => {
                    // Group cities by first letter
                    const citiesByLetter = cities.reduce((acc: any, city: any) => {
                      const firstLetter = city.name.charAt(0).toUpperCase();
                      if (!acc[firstLetter]) {
                        acc[firstLetter] = [];
                      }
                      acc[firstLetter].push(city);
                      return acc;
                    }, {});

                    // Sort cities within each letter group alphabetically
                    Object.keys(citiesByLetter).forEach(letter => {
                      citiesByLetter[letter].sort((a: any, b: any) => a.name.localeCompare(b.name));
                    });

                    // Create alphabet array and filter only letters that have cities
                    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    const lettersWithCities = alphabet.filter(letter => citiesByLetter[letter]?.length > 0);

                    const toggleLetter = (letter: string) => {
                      setOpenLetters(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(letter)) {
                          newSet.delete(letter);
                        } else {
                          newSet.add(letter);
                        }
                        return newSet;
                      });
                    };

                    return lettersWithCities.map(letter => (
                      <Collapsible
                        key={letter}
                        open={openLetters.has(letter)}
                        onOpenChange={() => toggleLetter(letter)}
                      >
                        <CollapsibleTrigger className="flex items-center w-full p-3 text-left hover:bg-muted/30 rounded-lg transition-colors group" data-testid={`button-letter-${letter.toLowerCase()}`}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {openLetters.has(letter) ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-primary">{letter}</span>
                              </div>
                              <span className="font-medium text-foreground">
                                {letter} Cities
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {citiesByLetter[letter].length}
                            </span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-11 pr-3 pb-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            {citiesByLetter[letter].map((city: any) => (
                              <div
                                key={city.id}
                                className="p-4 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                                data-testid={`city-card-${city.name.toLowerCase().replace(/\s+/g, '-').replace(/,/g, '')}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-foreground text-sm">{city.name}</h5>
                                    <p className="text-xs text-muted-foreground">{city.country}</p>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                                    city.isPublished 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {city.isPublished ? 'Live' : 'Draft'}
                                  </span>
                                </div>
                                
                                {city.scheduledDate && (
                                  <div className="flex items-center text-xs text-accent mt-2">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    <span className="bg-accent/10 px-2 py-1 rounded">
                                      {new Date(city.scheduledDate).toLocaleDateString('en-US', { 
                                        weekday: 'short',
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                                
                                {city.isPinned && (
                                  <div className="mt-2">
                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                                      Pinned
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No cities created yet. Start by generating your first city!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cities Management */}
        <div id="cities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Globe className="mr-3 text-primary w-5 h-5" />
                City Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCities ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : cities && cities.length > 0 ? (
                <div className="space-y-4">
                  {cities.map((city: any) => (
                    <div 
                      key={city.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {city.name}, {city.country}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            city.isPublished 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {city.isPublished ? 'Published' : 'Draft'}
                          </span>
                          {city.scheduledDate && (
                            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                              📅 Scheduled: {new Date(city.scheduledDate).toLocaleDateString()}
                            </span>
                          )}
                          {city.isPinned && (
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary">
                              Pinned
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Created: {new Date(city.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCity(city.id);
                            // Scroll to the content editor
                            setTimeout(() => {
                              const editorElement = document.querySelector('[data-testid="content-editor-card"]');
                              if (editorElement) {
                                editorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                          data-testid={`button-edit-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/city/${city.id}`, '_blank')}
                          data-testid={`button-view-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${city.name}, ${city.country}"? This action cannot be undone and will delete all content cards.`)) {
                              deleteCityMutation.mutate(city.id);
                            }
                          }}
                          data-testid={`button-delete-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                          disabled={deleteCityMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No cities created yet. Start by generating your first city!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-2" data-testid="stat-total-cities">
                {cities?.length || 0}
              </h4>
              <p className="text-muted-foreground">Total Cities</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-accent" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-2" data-testid="stat-published-cities">
                {cities?.filter((city: any) => city.isPublished).length || 0}
              </h4>
              <p className="text-muted-foreground">Published</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-2" data-testid="stat-draft-cities">
                {cities?.filter((city: any) => !city.isPublished).length || 0}
              </h4>
              <p className="text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
