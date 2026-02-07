import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Location {
    roadName: string;
    area: string;
    city: string;
    suburb: string;
}
export interface PropertyTypeDistribution {
    region: string;
    commercialCount: bigint;
    industrialCount: bigint;
    residentialCount: bigint;
    regionType: RegionType;
}
export interface FurnishingDistribution {
    region: string;
    furnishedCount: bigint;
    unfurnishedCount: bigint;
    semiFurnishedCount: bigint;
    regionType: RegionType;
}
export type Time = bigint;
export interface ConfigurationDistribution {
    region: string;
    bungalowCount: bigint;
    bhk4Count: bigint;
    bhk1_5Count: bigint;
    bhk2Count: bigint;
    bhk2_5Count: bigint;
    rk1Count: bigint;
    independentHouseCount: bigint;
    jodiFlatCount: bigint;
    bhk5Count: bigint;
    bhk3_5Count: bigint;
    bhk3Count: bigint;
    bhk1Count: bigint;
    regionType: RegionType;
    duplexCount: bigint;
    penthouseCount: bigint;
}
export interface Coordinates {
    lat: number;
    lng: number;
}
export interface UserProfile {
    contactInfo: string;
    name: string;
}
export interface Profile {
    id: Principal;
    active: boolean;
    contactInfo: string;
    name: string;
    createdAt: Time;
    role: Role;
    updatedAt: Time;
}
export interface Property {
    id: string;
    status: Status;
    title: string;
    propertyType: PropertyType;
    listedBy: Principal;
    createdAt: Time;
    description: string;
    updatedAt: Time;
    category: Category;
    configuration: Configuration;
    price: bigint;
    furnishing: Furnishing;
    location: Location;
    coordinates: Coordinates;
    images: Array<ExternalBlob>;
}
export interface CategoryDistribution {
    region: string;
    resaleCount: bigint;
    rentalCount: bigint;
    regionType: RegionType;
    underConstructionCount: bigint;
}
export interface SearchCriteria {
    lat?: number;
    lng?: number;
    status?: Status;
    roadName?: string;
    propertyType?: PropertyType;
    area?: string;
    city?: string;
    maxPrice?: bigint;
    suburb?: string;
    category?: Category;
    radius?: number;
    configuration?: Configuration;
    minPrice?: bigint;
    furnishing?: Furnishing;
}
export interface AdvancedFilter {
    categories: Array<Category>;
    configurations: Array<Configuration>;
    propertyTypes: Array<PropertyType>;
    statuses: Array<Status>;
    locations: Array<Location>;
    coordinateFilters: Array<{
        lat: number;
        lng: number;
        radius: number;
    }>;
    furnishings: Array<Furnishing>;
    priceRanges: Array<[bigint | null, bigint | null]>;
}
export interface PropertyDensity {
    region: string;
    propertyCount: bigint;
    regionType: RegionType;
}
export interface RegionalDistribution {
    region: string;
    averagePrice?: bigint;
    priceRange: {
        maxPrice?: bigint;
        minPrice?: bigint;
    };
    furnishingDistribution: {
        semiFurnished: bigint;
        furnished: bigint;
        unfurnished: bigint;
    };
    configurationDistribution: {
        rk1: bigint;
        bhk1: bigint;
        bhk2: bigint;
        bhk3: bigint;
        bhk4: bigint;
        bhk5: bigint;
        penthouse: bigint;
        jodiFlat: bigint;
        bhk1_5: bigint;
        bhk2_5: bigint;
        bhk3_5: bigint;
        bungalow: bigint;
        independentHouse: bigint;
        duplex: bigint;
    };
    categoryDistribution: {
        rental: bigint;
        resale: bigint;
        underConstruction: bigint;
    };
    propertyCount: bigint;
    propertyTypeDistribution: {
        commercial: bigint;
        residential: bigint;
        industrial: bigint;
    };
    regionType: RegionType;
}
export interface PricingHeatmap {
    region: string;
    averagePrice?: bigint;
    priceRange: {
        maxPrice?: bigint;
        minPrice?: bigint;
    };
    regionType: RegionType;
}
export interface CombinedAnalytics {
    propertyDensity: Array<PropertyDensity>;
    furnishingDistribution: Array<FurnishingDistribution>;
    configurationDistribution: Array<ConfigurationDistribution>;
    categoryDistribution: Array<CategoryDistribution>;
    pricingHeatmap: Array<PricingHeatmap>;
    propertyTypeDistribution: Array<PropertyTypeDistribution>;
    regionalDistribution: Array<RegionalDistribution>;
}
export interface Inquiry {
    id: string;
    customerName: string;
    status: Status__1;
    contactInfo: string;
    source: Source;
    assignedAgent: Principal;
    createdAt: Time;
    propertyId: string;
    updatedAt: Time;
    notes: string;
}
export enum Category {
    rental = "rental",
    resale = "resale",
    underConstruction = "underConstruction"
}
export enum Configuration {
    rk1 = "rk1",
    bhk1 = "bhk1",
    bhk2 = "bhk2",
    bhk3 = "bhk3",
    bhk4 = "bhk4",
    bhk5 = "bhk5",
    penthouse = "penthouse",
    jodiFlat = "jodiFlat",
    bhk1_5 = "bhk1_5",
    bhk2_5 = "bhk2_5",
    bhk3_5 = "bhk3_5",
    bungalow = "bungalow",
    independentHouse = "independentHouse",
    duplex = "duplex"
}
export enum Furnishing {
    semiFurnished = "semiFurnished",
    furnished = "furnished",
    unfurnished = "unfurnished"
}
export enum PropertyType {
    commercial = "commercial",
    residential = "residential",
    industrial = "industrial"
}
export enum RegionType {
    area = "area",
    city = "city",
    neighborhood = "neighborhood",
    zone = "zone",
    suburb = "suburb"
}
export enum Role {
    admin = "admin",
    agent = "agent",
    juniorAgent = "juniorAgent",
    assistant = "assistant"
}
export enum Source {
    referral = "referral",
    website = "website",
    walkIn = "walkIn",
    phone = "phone",
    socialMedia = "socialMedia"
}
export enum Status {
    rented = "rented",
    sold = "sold",
    underContract = "underContract",
    available = "available"
}
export enum Status__1 {
    new_ = "new",
    closed = "closed",
    followUp = "followUp",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAgent(agentPrincipal: Principal, name: string, contactInfo: string, role: Role): Promise<void>;
    addInquiry(propertyId: string, customerName: string, contactInfo: string, source: Source, assignedAgent: Principal, notes: string): Promise<string>;
    addProperty(title: string, description: string, location: Location, coordinates: Coordinates, price: bigint, category: Category, propertyType: PropertyType, configuration: Configuration, furnishing: Furnishing, images: Array<ExternalBlob>): Promise<string>;
    advancedFilterProperties(advancedFilters: AdvancedFilter): Promise<Array<Property>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deactivateAgent(agentId: Principal): Promise<void>;
    filterPropertiesByCategoryAndConfig(category: Category, configuration: Configuration): Promise<Array<Property>>;
    filterPropertiesByConfiguration(configuration: Configuration): Promise<Array<Property>>;
    getAgent(agentId: Principal): Promise<Profile>;
    getAllAgents(): Promise<Array<Profile>>;
    getAllCities(): Promise<Array<string>>;
    getAllInquiries(): Promise<Array<Inquiry>>;
    getAllProperties(): Promise<Array<Property>>;
    getAreasForSuburb(city: string, suburb: string): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCombinedAnalytics(): Promise<CombinedAnalytics>;
    getConfigurationDistribution(): Promise<Array<ConfigurationDistribution>>;
    getFurnishingDistribution(): Promise<Array<FurnishingDistribution>>;
    getInquiriesByAgent(agentId: Principal): Promise<Array<Inquiry>>;
    getInquiriesByProperty(propertyId: string): Promise<Array<Inquiry>>;
    getInquiry(inquiryId: string): Promise<Inquiry>;
    getPropertiesByCategory(category: Category): Promise<Array<Property>>;
    getPropertiesByCategoryAndType(category: Category, propertyType: PropertyType): Promise<Array<Property>>;
    getPropertiesByPropertyType(propertyType: PropertyType): Promise<Array<Property>>;
    getProperty(propertyId: string): Promise<Property>;
    getSuburbsForCity(city: string): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    resetToFreshDraft(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchAndFilterProperties(criteria: SearchCriteria): Promise<Array<Property>>;
    updateAgent(agentId: Principal, name: string, contactInfo: string, role: Role): Promise<void>;
    updateInquiry(inquiryId: string, customerName: string, contactInfo: string, source: Source, status: Status__1, assignedAgent: Principal, notes: string): Promise<void>;
    updateProperty(propertyId: string, title: string, description: string, location: Location, coordinates: Coordinates, price: bigint, category: Category, propertyType: PropertyType, configuration: Configuration, furnishing: Furnishing, status: Status, images: Array<ExternalBlob>): Promise<void>;
}
