import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Search, Filter, MapPin, Globe, Map, Calendar } from "lucide-react";
import { CityCard } from "@/components/city-card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import Footer from "@/components/Footer";

export default function LibraryPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  // const [stateFilter, setStateFilter] = useState("all"); // TO BE IMPLEMENTED LATER
  // const [regionFilter, setRegionFilter] = useState("all"); // TO BE IMPLEMENTED LATER
  const [themeFilter, setThemeFilter] = useState("all");

  // Library is now public - no authentication required

  // Fetch all published cities for the library
  const { data: cities, isLoading: loadingCities } = useQuery<any[]>({
    queryKey: ["/api/cities/library"],
    retry: false,
  });

  // Fetch city content for each city (we'll need this for theme filtering)
  const { data: allCitiesContent, isLoading: loadingContent } = useQuery<any[]>({
    queryKey: ["/api/cities/all-content"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Library is public - no user check needed

  // Filter cities based on search and filters
  const filteredCities = cities?.filter(city => {
    const matchesSearch = !searchTerm || 
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (city.state && city.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (city.region && city.region.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCountry = countryFilter === "all" || city.country === countryFilter;
    // const matchesState = stateFilter === "all" || city.state === stateFilter; // TO BE IMPLEMENTED LATER
    // const matchesRegion = regionFilter === "all" || city.region === regionFilter; // TO BE IMPLEMENTED LATER
    
    // Theme filtering would require checking city content
    const matchesTheme = themeFilter === "all"; // TODO: Implement theme filtering based on content
    
    return matchesSearch && matchesCountry && matchesTheme; // && matchesState && matchesRegion; // TO BE IMPLEMENTED LATER
  }) || [];

  // Get unique values for filter dropdowns
  const countries = Array.from(new Set(cities?.map(city => city.country) || []));

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="site-header">
        <div className="logo-area">
          <div className="logo-icon">
            <MapPin className="w-6 h-6" />
          </div>
          <span className="brand-name">City Discoverer</span>
          <span className="tagline">City of the Day™</span>
        </div>
        <nav className="nav-links">
          <Link href="/">
            <a href="/">Home</a>
          </Link>
          <Link href="/library">
            <a href="/library">Library</a>
          </Link>
          {(user as any)?.email === import.meta.env.VITE_ADMIN_EMAIL && user && (
            <Link href="/admin">
              <a href="/admin">Admin</a>
            </Link>
          )}
        </nav>
        <div className="auth-area">
          {user ? (
            <div className="user-section">
              <span className="welcome-text">Welcome, {(user as any)?.firstName || 'Explorer'}</span>
              <button 
                className="sign-in-btn" 
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="user-section">
              <button 
                className="sign-in-btn" 
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Library className="w-12 h-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Evergreen Library
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Explore our complete collection of cities and discover new destinations
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredCities.length} Cities Available
          </Badge>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search cities, countries, states..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-cities"
                    />
                  </div>
                </div>

                {/* Country Filter */}
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger data-testid="select-country-filter">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* State Filter - TO BE IMPLEMENTED LATER */}

                {/* Theme Filter */}
                <Select value={themeFilter} onValueChange={setThemeFilter}>
                  <SelectTrigger data-testid="select-theme-filter">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Themes</SelectItem>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="culture">Culture & Arts</SelectItem>
                    <SelectItem value="outdoors">Outdoors & Nature</SelectItem>
                    <SelectItem value="architecture">Architecture</SelectItem>
                    <SelectItem value="budget">Budget Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || countryFilter !== "all" || themeFilter !== "all") && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {searchTerm && (
                    <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchTerm("")}>
                      Search: "{searchTerm}" ×
                    </Badge>
                  )}
                  {countryFilter !== "all" && (
                    <Badge variant="outline" className="cursor-pointer" onClick={() => setCountryFilter("all")}>
                      Country: {countryFilter} ×
                    </Badge>
                  )}
                  {/* State filter badge - TO BE IMPLEMENTED LATER */}
                  {themeFilter !== "all" && (
                    <Badge variant="outline" className="cursor-pointer" onClick={() => setThemeFilter("all")}>
                      Theme: {themeFilter} ×
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loadingCities ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="text-center py-20">
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No cities found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCities.map(city => (
                <Link key={city.id} href={`/city/${city.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 postcard-shadow flex flex-col h-full">
                    <CardHeader className="pb-3 min-h-[88px]">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-bold text-foreground line-clamp-1">
                            {city.name}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm line-clamp-1">
                            {city.country}
                          </p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                          <MapPin className="w-6 h-6 text-primary mb-1" />
                          {city.publishedDate && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(city.publishedDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-between gap-3 flex-1">
                      <div className="space-y-3">
                        {/* CTA Buttons - Always visible for lead generation */}
                        <div className="flex flex-wrap gap-2 min-h-[36px]">
                          {city.cityCtaLinks && Array.isArray(city.cityCtaLinks) && city.cityCtaLinks.slice(0, 2).map((link: any, index: number) => {
                            if (!link?.text?.trim()) return null;
                            const truncatedText = link.text.length > 18 ? link.text.substring(0, 18) + '...' : link.text;
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs max-w-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(link.url, '_blank');
                                }}
                                data-testid={`library-cta-${index}`}
                              >
                                <span className="truncate max-w-[10rem]">
                                  {truncatedText}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/city/${city.id}`;
                          }}
                          data-testid="button-explore-city"
                        >
                          <Map className="w-4 h-4 mr-2" />
                          Explore City
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}