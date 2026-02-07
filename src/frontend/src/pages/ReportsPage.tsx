import { useState, useMemo } from 'react';
import { useGetAllProperties, useGetAllInquiries, useGetAllAgents, useGetCombinedAnalytics } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Category, Source, Status, Status__1 } from '../backend';
import { Loader2, TrendingUp, PieChartIcon, BarChart3, Download, MapIcon } from 'lucide-react';
import PropertyMap from '../components/PropertyMap';
import type { MapFilters } from '../components/PropertyMap';
import MapLinkedInsights from '../components/MapLinkedInsights';

export default function ReportsPage() {
  const { data: properties = [], isLoading: propertiesLoading } = useGetAllProperties();
  const { data: inquiries = [], isLoading: inquiriesLoading } = useGetAllInquiries();
  const { data: agents = [], isLoading: agentsLoading } = useGetAllAgents();
  const { data: combinedAnalytics, isLoading: analyticsLoading } = useGetCombinedAnalytics();

  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [mapFilters, setMapFilters] = useState<MapFilters>({});
  const [isMapFiltering, setIsMapFiltering] = useState(false);

  const isLoading = propertiesLoading || inquiriesLoading || agentsLoading;

  const COLORS = ['oklch(var(--chart-1))', 'oklch(var(--chart-2))', 'oklch(var(--chart-3))', 'oklch(var(--chart-4))', 'oklch(var(--chart-5))'];

  // Property Category Distribution
  const categoryData = useMemo(() => {
    return [
      { name: 'Resale', value: properties.filter((p) => p.category === Category.resale).length },
      { name: 'Rental', value: properties.filter((p) => p.category === Category.rental).length },
      { name: 'Under Construction', value: properties.filter((p) => p.category === Category.underConstruction).length },
    ];
  }, [properties]);

  // Property Status Distribution
  const statusData = useMemo(() => {
    return [
      { name: 'Available', value: properties.filter((p) => p.status === Status.available).length },
      { name: 'Sold', value: properties.filter((p) => p.status === Status.sold).length },
      { name: 'Rented', value: properties.filter((p) => p.status === Status.rented).length },
      { name: 'Under Contract', value: properties.filter((p) => p.status === Status.underContract).length },
    ];
  }, [properties]);

  // Inquiry Source Distribution
  const sourceData = useMemo(() => {
    return [
      { name: 'Website', value: inquiries.filter((i) => i.source === Source.website).length },
      { name: 'Referral', value: inquiries.filter((i) => i.source === Source.referral).length },
      { name: 'Walk-in', value: inquiries.filter((i) => i.source === Source.walkIn).length },
      { name: 'Phone', value: inquiries.filter((i) => i.source === Source.phone).length },
      { name: 'Social Media', value: inquiries.filter((i) => i.source === Source.socialMedia).length },
    ];
  }, [inquiries]);

  // Inquiry Status Distribution
  const inquiryStatusData = useMemo(() => {
    return [
      { name: 'New', value: inquiries.filter((i) => i.status === Status__1.new_).length },
      { name: 'In Progress', value: inquiries.filter((i) => i.status === Status__1.inProgress).length },
      { name: 'Follow Up', value: inquiries.filter((i) => i.status === Status__1.followUp).length },
      { name: 'Closed', value: inquiries.filter((i) => i.status === Status__1.closed).length },
    ];
  }, [inquiries]);

  // Agent Performance
  const agentPerformanceData = useMemo(() => {
    return agents.map((agent) => ({
      name: agent.name,
      properties: properties.filter((p) => p.listedBy.toString() === agent.id.toString()).length,
      inquiries: inquiries.filter((i) => i.assignedAgent.toString() === agent.id.toString()).length,
    }));
  }, [agents, properties, inquiries]);

  // Price Range Distribution
  const priceRangeData = useMemo(() => {
    const ranges = [
      { name: '< 50L', min: 0, max: 5000000 },
      { name: '50L - 1Cr', min: 5000000, max: 10000000 },
      { name: '1Cr - 2Cr', min: 10000000, max: 20000000 },
      { name: '2Cr - 5Cr', min: 20000000, max: 50000000 },
      { name: '> 5Cr', min: 50000000, max: Infinity },
    ];

    return ranges.map((range) => ({
      name: range.name,
      count: properties.filter((p) => Number(p.price) >= range.min && Number(p.price) < range.max).length,
    }));
  }, [properties]);

  // Location Distribution (Top 5 suburbs)
  const locationData = useMemo(() => {
    const suburbCounts = properties.reduce((acc, p) => {
      acc[p.location.suburb] = (acc[p.location.suburb] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(suburbCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([suburb, count]) => ({ name: suburb, count }));
  }, [properties]);

  // Location-based analytics: Property count by city
  const cityPropertyCounts = useMemo(() => {
    const cityCounts = properties.reduce((acc, p) => {
      acc[p.location.city] = (acc[p.location.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cityCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([city, count]) => ({ city, count }));
  }, [properties]);

  // Location-based analytics: Average price by city
  const cityAveragePrices = useMemo(() => {
    const cityPrices = properties.reduce((acc, p) => {
      if (!acc[p.location.city]) {
        acc[p.location.city] = { total: 0, count: 0 };
      }
      acc[p.location.city].total += Number(p.price);
      acc[p.location.city].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(cityPrices)
      .map(([city, data]) => ({
        city,
        averagePrice: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.averagePrice - a.averagePrice);
  }, [properties]);

  // Location-based analytics: Property count by suburb
  const suburbPropertyCounts = useMemo(() => {
    const suburbCounts = properties.reduce((acc, p) => {
      acc[p.location.suburb] = (acc[p.location.suburb] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(suburbCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([suburb, count]) => ({ suburb, count }));
  }, [properties]);

  // Location-based analytics: Average price by suburb
  const suburbAveragePrices = useMemo(() => {
    const suburbPrices = properties.reduce((acc, p) => {
      if (!acc[p.location.suburb]) {
        acc[p.location.suburb] = { total: 0, count: 0 };
      }
      acc[p.location.suburb].total += Number(p.price);
      acc[p.location.suburb].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(suburbPrices)
      .map(([suburb, data]) => ({
        suburb,
        averagePrice: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.averagePrice - a.averagePrice)
      .slice(0, 10);
  }, [properties]);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    let filtered = properties;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (priceRange !== 'all') {
      const ranges: Record<string, [number, number]> = {
        low: [0, 5000000],
        medium: [5000000, 20000000],
        high: [20000000, Infinity],
      };
      const [min, max] = ranges[priceRange];
      filtered = filtered.filter((p) => Number(p.price) >= min && Number(p.price) < max);
    }

    return filtered;
  }, [properties, categoryFilter, priceRange]);

  // Map-filtered properties
  const mapFilteredProperties = useMemo(() => {
    let filtered = properties;

    if (mapFilters.category) {
      filtered = filtered.filter((p) => p.category === mapFilters.category);
    }

    if (mapFilters.status) {
      filtered = filtered.filter((p) => p.status === mapFilters.status);
    }

    if (mapFilters.minPrice !== undefined) {
      filtered = filtered.filter((p) => Number(p.price) >= mapFilters.minPrice!);
    }

    if (mapFilters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => Number(p.price) <= mapFilters.maxPrice!);
    }

    if (mapFilters.city) {
      filtered = filtered.filter((p) => p.location.city === mapFilters.city);
    }

    if (mapFilters.suburb) {
      filtered = filtered.filter((p) => p.location.suburb === mapFilters.suburb);
    }

    if (mapFilters.area) {
      filtered = filtered.filter((p) => p.location.area === mapFilters.area);
    }

    if (mapFilters.radiusKm && mapFilters.centerLat !== undefined && mapFilters.centerLng !== undefined) {
      filtered = filtered.filter((p) => {
        const dLat = mapFilters.centerLat! - p.coordinates.lat;
        const dLng = mapFilters.centerLng! - p.coordinates.lng;
        const distanceSquared = dLat * dLat + dLng * dLng;
        const radiusSquared = mapFilters.radiusKm! * mapFilters.radiusKm!;
        return distanceSquared <= radiusSquared;
      });
    }

    return filtered;
  }, [properties, mapFilters]);

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export properties to CSV
  const exportPropertiesToCSV = () => {
    const exportData = filteredProperties.map((p) => ({
      Title: p.title,
      Description: p.description,
      City: p.location.city,
      Suburb: p.location.suburb,
      Area: p.location.area,
      Price: Number(p.price),
      Category: p.category,
      Status: p.status,
      Latitude: p.coordinates.lat,
      Longitude: p.coordinates.lng,
    }));
    exportToCSV(exportData, 'properties_report');
  };

  // Export inquiries to CSV
  const exportInquiriesToCSV = () => {
    const exportData = inquiries.map((i) => ({
      Customer: i.customerName,
      Contact: i.contactInfo,
      Source: i.source,
      Status: i.status,
      PropertyId: i.propertyId,
      Notes: i.notes,
    }));
    exportToCSV(exportData, 'inquiries_report');
  };

  // Export location analytics to CSV
  const exportLocationAnalyticsToCSV = () => {
    const exportData = [
      ...cityPropertyCounts.map((d) => ({
        Type: 'City',
        Location: d.city,
        PropertyCount: d.count,
        AveragePrice: cityAveragePrices.find((c) => c.city === d.city)?.averagePrice || 0,
      })),
      ...suburbPropertyCounts.map((d) => ({
        Type: 'Suburb',
        Location: d.suburb,
        PropertyCount: d.count,
        AveragePrice: suburbAveragePrices.find((s) => s.suburb === d.suburb)?.averagePrice || 0,
      })),
    ];
    exportToCSV(exportData, 'location_analytics_report');
  };

  const handleMapFilterChange = (filters: MapFilters) => {
    setIsMapFiltering(true);
    setMapFilters(filters);
    setTimeout(() => setIsMapFiltering(false), 300);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights and data visualization with map-based analytics</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Filter by Category</Label>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as Category | 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value={Category.resale}>Resale</SelectItem>
              <SelectItem value={Category.rental}>Rental</SelectItem>
              <SelectItem value={Category.underConstruction}>Under Construction</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Filter by Price Range</Label>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Low (&lt; 50L)</SelectItem>
              <SelectItem value="medium">Medium (50L - 2Cr)</SelectItem>
              <SelectItem value="high">High (&gt; 2Cr)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="location">Location Analytics</TabsTrigger>
          <TabsTrigger value="map-insights">Map Insights</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Property Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Property Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Inquiry Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inquiry Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inquiryStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={exportPropertiesToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Range Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceRangeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[2]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtered Properties ({filteredProperties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.slice(0, 10).map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.title}</TableCell>
                        <TableCell>
                          {property.location.area}, {property.location.suburb}
                        </TableCell>
                        <TableCell>₹{Number(property.price).toLocaleString()}</TableCell>
                        <TableCell>{property.category}</TableCell>
                        <TableCell>{property.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredProperties.length > 10 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">Showing 10 of {filteredProperties.length} properties</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={exportLocationAnalyticsToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Count by City</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cityPropertyCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[0]} name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Price by City</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cityAveragePrices}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="averagePrice" stroke={COLORS[1]} strokeWidth={2} name="Avg Price" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Count by Suburb (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={suburbPropertyCounts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="suburb" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[2]} name="Properties" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Price by Suburb (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={suburbAveragePrices} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="suburb" type="category" width={100} />
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    <Bar dataKey="averagePrice" fill={COLORS[3]} name="Avg Price" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Interactive Map with Real-Time Analytics
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Use the map filters to explore properties and see analytics update in real-time
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full overflow-hidden rounded-lg border">
                <PropertyMap
                  properties={properties}
                  enableFilters={true}
                  onFilterChange={handleMapFilterChange}
                  isFiltering={isMapFiltering}
                  showClustering={true}
                />
              </div>
            </CardContent>
          </Card>

          <MapLinkedInsights
            properties={mapFilteredProperties}
            filters={mapFilters}
            isLoading={isMapFiltering}
          />
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={exportInquiriesToCSV} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inquiry Sources Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS[4]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inquiry Status Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={inquiryStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.slice(0, 10).map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">{inquiry.customerName}</TableCell>
                        <TableCell>{inquiry.contactInfo}</TableCell>
                        <TableCell>{inquiry.source}</TableCell>
                        <TableCell>{inquiry.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={agentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="properties" fill={COLORS[0]} name="Properties Listed" />
                  <Bar dataKey="inquiries" fill={COLORS[1]} name="Inquiries Handled" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Inquiries</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformanceData.map((agent, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agents[index]?.role}</TableCell>
                        <TableCell>{agent.properties}</TableCell>
                        <TableCell>{agent.inquiries}</TableCell>
                        <TableCell>{agents[index]?.active ? 'Active' : 'Inactive'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
