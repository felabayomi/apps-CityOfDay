import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Wand2, Edit, Trash2, Plus, Eye, MapPin, CalendarIcon } from "lucide-react";
import { AdminCityGenerator } from "@/components/admin-city-generator";
import { ContentEditor } from "@/components/content-editor";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function Admin() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Redirect to login if not authenticated
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch all cities for admin
  const { data: cities, isLoading: loadingCities } = useQuery<any[]>({
    queryKey: ["/api/admin/cities"],
    retry: false,
    enabled: !!user,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
            <span className="welcome-text">Admin: {user.firstName || 'User'}</span>
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
                <div>
                  {/* Scheduled Cities */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-4">Scheduled Content</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cities
                        .filter((city: any) => city.scheduledDate)
                        .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                        .map((city: any) => (
                          <div
                            key={city.id}
                            className="p-4 border border-accent/20 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-foreground">{city.name}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                city.isPublished 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {city.isPublished ? 'Live' : 'Draft'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{city.country}</p>
                            <div className="flex items-center text-xs text-accent">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {new Date(city.scheduledDate).toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                    {cities.filter((city: any) => city.scheduledDate).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>No content scheduled yet. Use the generator above to schedule content for specific dates!</p>
                      </div>
                    )}
                  </div>

                  {/* Unscheduled Content */}
                  {cities.filter((city: any) => !city.scheduledDate).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4">Unscheduled Content</h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {cities
                          .filter((city: any) => !city.scheduledDate)
                          .map((city: any) => (
                            <div
                              key={city.id}
                              className="p-3 border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                            >
                              <h6 className="font-medium text-foreground text-sm">{city.name}</h6>
                              <p className="text-xs text-muted-foreground">{city.country}</p>
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                                city.isPublished 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {city.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
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
                          onClick={() => setSelectedCity(city.id)}
                          data-testid={`button-edit-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-view-${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Eye className="w-4 h-4" />
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
    </div>
  );
}
