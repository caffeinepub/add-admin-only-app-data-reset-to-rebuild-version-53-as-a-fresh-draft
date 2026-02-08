import { useState, useEffect, useCallback } from 'react';
import { useGetAllProperties, useSearchAndFilterProperties, useAddProperty, useUpdateProperty } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, Edit, Loader2, MapPin, Map as MapIcon, Layers, Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Category, Status, PropertyType, Configuration, Furnishing, type Property, type Coordinates, type SearchCriteria, ExternalBlob } from '../backend';
import PropertyMap, { type MapFilters } from '../components/PropertyMap';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

interface ImagePreview {
  blob: ExternalBlob;
  url: string;
  file: File;
}

export default function PropertiesPage() {
  const { data: allProperties = [], isLoading: allPropertiesLoading } = useGetAllProperties();
  const addProperty = useAddProperty();
  const updateProperty = useUpdateProperty();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [showClustering, setShowClustering] = useState(true);
  const [showRadiusCircles, setShowRadiusCircles] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    suburb: '',
    area: '',
    roadName: '',
    price: '',
    category: Category.resale,
    propertyType: PropertyType.residential,
    configuration: Configuration.bhk2,
    furnishing: Furnishing.unfurnished,
    status: Status.available,
    coordinates: { lat: 19.0760, lng: 72.8777 } as Coordinates,
  });

  // Filter state for map - real-time filtering
  const [mapFilters, setMapFilters] = useState<MapFilters>({});
  const [useFilters, setUseFilters] = useState(false);

  // Build search criteria from map filters for real-time updates
  const searchCriteria: SearchCriteria = {
    category: mapFilters.category,
    propertyType: mapFilters.propertyType,
    configuration: mapFilters.configuration,
    furnishing: mapFilters.furnishing,
    minPrice: mapFilters.minPrice ? BigInt(mapFilters.minPrice) : undefined,
    maxPrice: mapFilters.maxPrice ? BigInt(mapFilters.maxPrice) : undefined,
    status: mapFilters.status,
    lat: mapFilters.centerLat,
    lng: mapFilters.centerLng,
    radius: mapFilters.radiusKm,
    city: mapFilters.city,
    suburb: mapFilters.suburb,
    area: mapFilters.area,
    roadName: mapFilters.roadName,
  };

  // Use filtered properties when filters are active - real-time query
  const { data: filteredProperties = [], isLoading: filteredLoading } = useSearchAndFilterProperties(searchCriteria);
  
  // Determine which properties to display
  const properties = useFilters ? filteredProperties : allProperties;
  const isLoading = useFilters ? filteredLoading : allPropertiesLoading;

  // Update useFilters when map filters change - real-time detection
  useEffect(() => {
    const hasActiveFilters = 
      mapFilters.category !== undefined ||
      mapFilters.propertyType !== undefined ||
      mapFilters.configuration !== undefined ||
      mapFilters.furnishing !== undefined ||
      mapFilters.minPrice !== undefined ||
      mapFilters.maxPrice !== undefined ||
      mapFilters.status !== undefined ||
      mapFilters.city !== undefined ||
      mapFilters.suburb !== undefined ||
      mapFilters.area !== undefined ||
      mapFilters.roadName !== undefined ||
      (mapFilters.centerLat !== undefined && mapFilters.centerLng !== undefined && mapFilters.radiusKm !== undefined);
    
    setUseFilters(hasActiveFilters);
  }, [mapFilters]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    const newPreviews: ImagePreview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setUploadError(`File ${file.name} is not a valid image format. Only JPG and PNG are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File ${file.name} exceeds the maximum size of 10 MB.`);
        continue;
      }

      try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Create ExternalBlob with upload progress tracking
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: percentage }));
        });

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        newPreviews.push({
          blob,
          url: previewUrl,
          file,
        });
      } catch (error) {
        console.error('Error processing file:', error);
        setUploadError(`Failed to process file ${file.name}`);
      }
    }

    setImagePreviews(prev => [...prev, ...newPreviews]);
    // Reset input
    event.target.value = '';
  };

  const removeImagePreview = (index: number) => {
    setImagePreviews(prev => {
      const updated = [...prev];
      // Revoke object URL to free memory
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleAdd = async () => {
    try {
      const images = imagePreviews.map(preview => preview.blob);
      
      await addProperty.mutateAsync({
        title: formData.title,
        description: formData.description,
        location: { 
          city: formData.city, 
          suburb: formData.suburb, 
          area: formData.area,
          roadName: formData.roadName 
        },
        coordinates: formData.coordinates,
        price: BigInt(formData.price),
        category: formData.category,
        propertyType: formData.propertyType,
        configuration: formData.configuration,
        furnishing: formData.furnishing,
        images,
      });
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding property:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedProperty) return;
    try {
      const images = imagePreviews.map(preview => preview.blob);
      
      await updateProperty.mutateAsync({
        propertyId: selectedProperty.id,
        title: formData.title,
        description: formData.description,
        location: { 
          city: formData.city, 
          suburb: formData.suburb, 
          area: formData.area,
          roadName: formData.roadName 
        },
        coordinates: formData.coordinates,
        price: BigInt(formData.price),
        category: formData.category,
        propertyType: formData.propertyType,
        configuration: formData.configuration,
        furnishing: formData.furnishing,
        status: formData.status,
        images,
      });
      setShowEditDialog(false);
      setSelectedProperty(null);
      resetForm();
    } catch (error) {
      console.error('Error updating property:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      city: '',
      suburb: '',
      area: '',
      roadName: '',
      price: '',
      category: Category.resale,
      propertyType: PropertyType.residential,
      configuration: Configuration.bhk2,
      furnishing: Furnishing.unfurnished,
      status: Status.available,
      coordinates: { lat: 19.0760, lng: 72.8777 },
    });
    // Clean up image previews
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    setImagePreviews([]);
    setUploadError('');
    setUploadProgress({});
  };

  const openEditDialog = async (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      city: property.location.city,
      suburb: property.location.suburb,
      area: property.location.area,
      roadName: property.location.roadName,
      price: property.price.toString(),
      category: property.category,
      propertyType: property.propertyType,
      configuration: property.configuration,
      furnishing: property.furnishing,
      status: property.status,
      coordinates: property.coordinates,
    });

    // Load existing images
    const existingPreviews: ImagePreview[] = [];
    for (const externalBlob of property.images) {
      try {
        const url = externalBlob.getDirectURL();
        existingPreviews.push({
          blob: externalBlob,
          url,
          file: new File([], 'existing-image.jpg'), // Placeholder file
        });
      } catch (error) {
        console.error('Error loading existing image:', error);
      }
    }
    setImagePreviews(existingPreviews);
    setShowEditDialog(true);
  };

  const handleCoordinatesChange = (coords: Coordinates) => {
    setFormData(prev => ({ ...prev, coordinates: coords }));
  };

  // Stable callback using useCallback to avoid stale state
  const handlePlaceSelected = useCallback((place: { city: string; suburb: string; area: string; roadName: string; coords: Coordinates }) => {
    console.log('PropertiesPage: Place selected', place);
    setFormData(prev => ({
      ...prev,
      city: place.city || prev.city,
      suburb: place.suburb || prev.suburb,
      area: place.area || prev.area,
      roadName: place.roadName || prev.roadName,
      coordinates: place.coords,
    }));
  }, []);

  const togglePropertySelection = (propertyId: string) => {
    setSelectedPropertyIds(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleMapFilterChange = (filters: MapFilters) => {
    setMapFilters(filters);
  };

  const getCategoryBadge = (category: Category) => {
    const colors: Record<Category, string> = {
      [Category.resale]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [Category.rental]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [Category.underConstruction]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return <Badge className={colors[category]}>{category}</Badge>;
  };

  const getPropertyTypeBadge = (propertyType: PropertyType) => {
    const colors: Record<PropertyType, string> = {
      [PropertyType.residential]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      [PropertyType.commercial]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      [PropertyType.industrial]: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    };
    const labels: Record<PropertyType, string> = {
      [PropertyType.residential]: 'Residential',
      [PropertyType.commercial]: 'Commercial',
      [PropertyType.industrial]: 'Industrial',
    };
    return <Badge className={colors[propertyType]}>{labels[propertyType]}</Badge>;
  };

  const getConfigurationLabel = (configuration: Configuration): string => {
    const labels: Record<Configuration, string> = {
      [Configuration.rk1]: '1 RK',
      [Configuration.bhk1]: '1 BHK',
      [Configuration.bhk1_5]: '1.5 BHK',
      [Configuration.bhk2]: '2 BHK',
      [Configuration.bhk2_5]: '2.5 BHK',
      [Configuration.bhk3]: '3 BHK',
      [Configuration.bhk3_5]: '3.5 BHK',
      [Configuration.bhk4]: '4 BHK',
      [Configuration.bhk5]: '5 BHK',
      [Configuration.jodiFlat]: 'Jodi Flat',
      [Configuration.duplex]: 'Duplex',
      [Configuration.penthouse]: 'Penthouse',
      [Configuration.bungalow]: 'Bungalow',
      [Configuration.independentHouse]: 'Independent House',
    };
    return labels[configuration];
  };

  const getFurnishingLabel = (furnishing: Furnishing): string => {
    const labels: Record<Furnishing, string> = {
      [Furnishing.unfurnished]: 'Unfurnished',
      [Furnishing.semiFurnished]: 'Semi Furnished',
      [Furnishing.furnished]: 'Furnished',
    };
    return labels[furnishing];
  };

  const getFurnishingBadge = (furnishing: Furnishing) => {
    const colors: Record<Furnishing, string> = {
      [Furnishing.unfurnished]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      [Furnishing.semiFurnished]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      [Furnishing.furnished]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    return <Badge className={colors[furnishing]}>{getFurnishingLabel(furnishing)}</Badge>;
  };

  const getStatusBadge = (status: Status) => {
    const variants: Record<Status, 'default' | 'secondary' | 'outline'> = {
      [Status.available]: 'default',
      [Status.sold]: 'secondary',
      [Status.rented]: 'secondary',
      [Status.underContract]: 'outline',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filterByCategory = (category: Category | 'all') => {
    if (category === 'all') return properties;
    return properties.filter((p) => p.category === category);
  };

  const PropertyTable = ({ properties }: { properties: Property[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showMapView && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedPropertyIds.length === properties.length && properties.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPropertyIds(properties.map(p => p.id));
                    } else {
                      setSelectedPropertyIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableHead>
            )}
            <TableHead>Title</TableHead>
            <TableHead>Images</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Property Type</TableHead>
            <TableHead>Configuration</TableHead>
            <TableHead>Furnishing</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showMapView ? 11 : 10} className="text-center text-muted-foreground">
                No properties found
              </TableCell>
            </TableRow>
          ) : (
            properties.map((property) => (
              <TableRow key={property.id}>
                {showMapView && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedPropertyIds.includes(property.id)}
                      onChange={() => togglePropertySelection(property.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{property.title}</TableCell>
                <TableCell>
                  {property.images.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{property.images.length}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No images</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {property.location.roadName && `${property.location.roadName}, `}
                    {property.location.area}, {property.location.suburb}
                  </div>
                </TableCell>
                <TableCell>₹{Number(property.price).toLocaleString()}</TableCell>
                <TableCell>{getCategoryBadge(property.category)}</TableCell>
                <TableCell>{getPropertyTypeBadge(property.propertyType)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-medium">
                    {getConfigurationLabel(property.configuration)}
                  </Badge>
                </TableCell>
                <TableCell>{getFurnishingBadge(property.furnishing)}</TableCell>
                <TableCell>{getStatusBadge(property.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(property)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const PropertyForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Property title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Property description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            placeholder="Suburb"
            value={formData.suburb}
            onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
          />
          <Input
            placeholder="Area"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          />
          <Input
            placeholder="Road Name"
            value={formData.roadName}
            onChange={(e) => setFormData({ ...formData, roadName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Map Location</Label>
        <div className="h-64 border rounded-md overflow-hidden">
          <PropertyMap
            properties={[]}
            center={formData.coordinates}
            draggableMarker={formData.coordinates}
            onMarkerDragEnd={handleCoordinatesChange}
            onPlaceSelected={handlePlaceSelected}
            showClustering={false}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Search for a location or drag the marker to set coordinates
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Category.resale}>Resale</SelectItem>
              <SelectItem value={Category.rental}>Rental</SelectItem>
              <SelectItem value={Category.underConstruction}>Under Construction</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <Select
            value={formData.propertyType}
            onValueChange={(value) => setFormData({ ...formData, propertyType: value as PropertyType })}
          >
            <SelectTrigger id="propertyType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PropertyType.residential}>Residential</SelectItem>
              <SelectItem value={PropertyType.commercial}>Commercial</SelectItem>
              <SelectItem value={PropertyType.industrial}>Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="configuration">Configuration</Label>
          <Select
            value={formData.configuration}
            onValueChange={(value) => setFormData({ ...formData, configuration: value as Configuration })}
          >
            <SelectTrigger id="configuration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Configuration.rk1}>1 RK</SelectItem>
              <SelectItem value={Configuration.bhk1}>1 BHK</SelectItem>
              <SelectItem value={Configuration.bhk1_5}>1.5 BHK</SelectItem>
              <SelectItem value={Configuration.bhk2}>2 BHK</SelectItem>
              <SelectItem value={Configuration.bhk2_5}>2.5 BHK</SelectItem>
              <SelectItem value={Configuration.bhk3}>3 BHK</SelectItem>
              <SelectItem value={Configuration.bhk3_5}>3.5 BHK</SelectItem>
              <SelectItem value={Configuration.bhk4}>4 BHK</SelectItem>
              <SelectItem value={Configuration.bhk5}>5 BHK</SelectItem>
              <SelectItem value={Configuration.jodiFlat}>Jodi Flat</SelectItem>
              <SelectItem value={Configuration.duplex}>Duplex</SelectItem>
              <SelectItem value={Configuration.penthouse}>Penthouse</SelectItem>
              <SelectItem value={Configuration.bungalow}>Bungalow</SelectItem>
              <SelectItem value={Configuration.independentHouse}>Independent House</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="furnishing">Furnishing</Label>
          <Select
            value={formData.furnishing}
            onValueChange={(value) => setFormData({ ...formData, furnishing: value as Furnishing })}
          >
            <SelectTrigger id="furnishing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Furnishing.unfurnished}>Unfurnished</SelectItem>
              <SelectItem value={Furnishing.semiFurnished}>Semi Furnished</SelectItem>
              <SelectItem value={Furnishing.furnished}>Furnished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showEditDialog && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Status.available}>Available</SelectItem>
                <SelectItem value={Status.sold}>Sold</SelectItem>
                <SelectItem value={Status.rented}>Rented</SelectItem>
                <SelectItem value={Status.underContract}>Under Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">Images</Label>
        <div className="flex items-center gap-2">
          <Input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={handleFileSelect}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImagePreview(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {uploadProgress[preview.file.name] !== undefined && uploadProgress[preview.file.name] < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-md overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress[preview.file.name]}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">Manage property listings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMapView(!showMapView)}>
            <MapIcon className="mr-2 h-4 w-4" />
            {showMapView ? 'Hide Map' : 'Show Map'}
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </div>

      {showMapView && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Map View</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showClustering}
                    onCheckedChange={setShowClustering}
                  />
                  <Label>Clustering</Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-md overflow-hidden border">
              <PropertyMap
                properties={properties}
                selectedPropertyIds={selectedPropertyIds}
                showClustering={showClustering}
                showRadiusCircles={showRadiusCircles}
                onFilterChange={handleMapFilterChange}
                enableFilters={true}
                isFiltering={useFilters}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({properties.length})</TabsTrigger>
                <TabsTrigger value="resale">Resale ({filterByCategory(Category.resale).length})</TabsTrigger>
                <TabsTrigger value="rental">Rental ({filterByCategory(Category.rental).length})</TabsTrigger>
                <TabsTrigger value="underConstruction">
                  Under Construction ({filterByCategory(Category.underConstruction).length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <PropertyTable properties={properties} />
              </TabsContent>
              <TabsContent value="resale">
                <PropertyTable properties={filterByCategory(Category.resale)} />
              </TabsContent>
              <TabsContent value="rental">
                <PropertyTable properties={filterByCategory(Category.rental)} />
              </TabsContent>
              <TabsContent value="underConstruction">
                <PropertyTable properties={filterByCategory(Category.underConstruction)} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Property Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>Fill in the property details below</DialogDescription>
          </DialogHeader>
          <PropertyForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addProperty.isPending}>
              {addProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Update the property details below</DialogDescription>
          </DialogHeader>
          <PropertyForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedProperty(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateProperty.isPending}>
              {updateProperty.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
