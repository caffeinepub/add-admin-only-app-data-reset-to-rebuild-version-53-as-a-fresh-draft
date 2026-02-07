import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';
import { Loader2, TrendingUp, MapPin, DollarSign } from 'lucide-react';
import type { Property, Category } from '../backend';
import type { MapFilters } from './PropertyMap';

interface MapLinkedInsightsProps {
  properties: Property[];
  filters: MapFilters;
  isLoading?: boolean;
}

export default function MapLinkedInsights({ properties, filters, isLoading = false }: MapLinkedInsightsProps) {
  const COLORS = ['oklch(var(--chart-1))', 'oklch(var(--chart-2))', 'oklch(var(--chart-3))', 'oklch(var(--chart-4))', 'oklch(var(--chart-5))'];

  // Category distribution for filtered properties
  const categoryDistribution = useMemo(() => {
    return [
      { name: 'Resale', value: properties.filter((p) => p.category === 'resale').length, color: '#3B82F6' },
      { name: 'Rental', value: properties.filter((p) => p.category === 'rental').length, color: '#10B981' },
      { name: 'Under Construction', value: properties.filter((p) => p.category === 'underConstruction').length, color: '#8B5CF6' },
    ].filter(item => item.value > 0);
  }, [properties]);

  // Price distribution for filtered properties
  const priceDistribution = useMemo(() => {
    const ranges = [
      { name: '< 50L', min: 0, max: 5000000 },
      { name: '50L-1Cr', min: 5000000, max: 10000000 },
      { name: '1Cr-2Cr', min: 10000000, max: 20000000 },
      { name: '2Cr-5Cr', min: 20000000, max: 50000000 },
      { name: '> 5Cr', min: 50000000, max: Infinity },
    ];

    return ranges.map((range) => ({
      name: range.name,
      count: properties.filter((p) => Number(p.price) >= range.min && Number(p.price) < range.max).length,
    })).filter(item => item.count > 0);
  }, [properties]);

  // Location distribution (top suburbs)
  const locationDistribution = useMemo(() => {
    const suburbCounts = properties.reduce((acc, p) => {
      acc[p.location.suburb] = (acc[p.location.suburb] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(suburbCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([suburb, count]) => ({ suburb, count }));
  }, [properties]);

  // Average price calculation
  const averagePrice = useMemo(() => {
    if (properties.length === 0) return 0;
    const total = properties.reduce((sum, p) => sum + Number(p.price), 0);
    return Math.round(total / properties.length);
  }, [properties]);

  // Price range
  const priceRange = useMemo(() => {
    if (properties.length === 0) return { min: 0, max: 0 };
    const prices = properties.map(p => Number(p.price));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [properties]);

  // Active filters count
  const activeFiltersCount = [
    filters.category,
    filters.status,
    filters.minPrice,
    filters.maxPrice,
    filters.city,
    filters.suburb,
    filters.area,
    filters.radiusKm && filters.centerLat && filters.centerLng,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Map-Linked Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Real-time insights based on current map view and filters
          </p>
        </div>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-sm">
            {activeFiltersCount} {activeFiltersCount === 1 ? 'Filter' : 'Filters'} Active
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{properties.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">₹{(averagePrice / 10000000).toFixed(2)}Cr</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Min Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold">₹{(priceRange.min / 10000000).toFixed(2)}Cr</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Max Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-2xl font-bold">₹{(priceRange.max / 10000000).toFixed(2)}Cr</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Property types in current view
                </p>
              </CardHeader>
              <CardContent>
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No properties in current view
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Price ranges in current view
                </p>
              </CardHeader>
              <CardContent>
                {priceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS[0]} name="Properties" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No properties in current view
                  </div>
                )}
              </CardContent>
            </Card>

            {locationDistribution.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Most popular suburbs in current view
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={locationDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="suburb" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS[2]} name="Properties" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {filters.category && (
                    <Badge variant="secondary">Category: {filters.category}</Badge>
                  )}
                  {filters.status && (
                    <Badge variant="secondary">Status: {filters.status}</Badge>
                  )}
                  {filters.city && (
                    <Badge variant="secondary">City: {filters.city}</Badge>
                  )}
                  {filters.suburb && (
                    <Badge variant="secondary">Suburb: {filters.suburb}</Badge>
                  )}
                  {filters.area && (
                    <Badge variant="secondary">Area: {filters.area}</Badge>
                  )}
                  {filters.minPrice !== undefined && (
                    <Badge variant="secondary">Min: ₹{filters.minPrice.toLocaleString()}</Badge>
                  )}
                  {filters.maxPrice !== undefined && (
                    <Badge variant="secondary">Max: ₹{filters.maxPrice.toLocaleString()}</Badge>
                  )}
                  {filters.radiusKm && filters.centerLat && filters.centerLng && (
                    <Badge variant="secondary">Radius: {filters.radiusKm} km</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
