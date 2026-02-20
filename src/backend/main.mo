import Array "mo:core/Array";
import Blob "mo:core/Blob";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";

// Apply migration with-clause to main actor

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  module Property {
    public type Location = {
      city : Text;
      suburb : Text;
      area : Text;
      roadName : Text;
    };

    public type Coordinates = {
      lat : Float;
      lng : Float;
    };

    public type Category = {
      #resale;
      #rental;
      #underConstruction;
    };

    public type PropertyType = {
      #residential;
      #commercial;
      #industrial;
    };

    public type Configuration = {
      #rk1;
      #bhk1;
      #bhk1_5;
      #bhk2;
      #bhk2_5;
      #bhk3;
      #bhk3_5;
      #bhk4;
      #bhk5;
      #jodiFlat;
      #duplex;
      #penthouse;
      #bungalow;
      #independentHouse;
    };

    public type Furnishing = {
      #unfurnished;
      #semiFurnished;
      #furnished;
    };

    public type Status = {
      #available;
      #sold;
      #rented;
      #underContract;
    };

    public type Property = {
      id : Text;
      title : Text;
      description : Text;
      location : Location;
      coordinates : Coordinates;
      price : Nat;
      category : Category;
      propertyType : PropertyType;
      configuration : Configuration;
      furnishing : Furnishing;
      status : Status;
      listedBy : Principal;
      createdAt : Time.Time;
      updatedAt : Time.Time;
      images : [Storage.ExternalBlob];
    };

    public func compare(property1 : Property, property2 : Property) : Order.Order {
      Nat.compare(property1.price, property2.price);
    };

    public type SearchCriteria = {
      city : ?Text;
      suburb : ?Text;
      area : ?Text;
      roadName : ?Text;
      category : ?Category;
      propertyType : ?PropertyType;
      configuration : ?Configuration;
      furnishing : ?Furnishing;
      minPrice : ?Nat;
      maxPrice : ?Nat;
      status : ?Status;
      lat : ?Float;
      lng : ?Float;
      radius : ?Float;
    };

    public type AdvancedFilter = {
      locations : [Location];
      categories : [Category];
      propertyTypes : [PropertyType];
      configurations : [Configuration];
      furnishings : [Furnishing];
      priceRanges : [(?Nat, ?Nat)];
      statuses : [Status];
      coordinateFilters : [{ lat : Float; lng : Float; radius : Float }];
    };
  };

  module Analytics {
    public type LocationStats = {
      propertyCount : Nat;
      averagePrice : ?Nat;
      categoryDistribution : {
        resale : Nat;
        rental : Nat;
        underConstruction : Nat;
      };
      propertyTypeDistribution : {
        residential : Nat;
        commercial : Nat;
        industrial : Nat;
      };
      configurationDistribution : {
        rk1 : Nat;
        bhk1 : Nat;
        bhk1_5 : Nat;
        bhk2 : Nat;
        bhk2_5 : Nat;
        bhk3 : Nat;
        bhk3_5 : Nat;
        bhk4 : Nat;
        bhk5 : Nat;
        jodiFlat : Nat;
        duplex : Nat;
        penthouse : Nat;
        bungalow : Nat;
        independentHouse : Nat;
      };
      furnishingDistribution : {
        unfurnished : Nat;
        semiFurnished : Nat;
        furnished : Nat;
      };
      priceRange : {
        minPrice : ?Nat;
        maxPrice : ?Nat;
      };
      region : Text;
      regionType : RegionType;
    };

    public type PropertyDensity = {
      region : Text;
      regionType : RegionType;
      propertyCount : Nat;
    };

    public type PricingHeatmap = {
      region : Text;
      regionType : RegionType;
      averagePrice : ?Nat;
      priceRange : {
        minPrice : ?Nat;
        maxPrice : ?Nat;
      };
    };

    public type RegionalDistribution = {
      region : Text;
      regionType : RegionType;
      propertyCount : Nat;
      categoryDistribution : {
        resale : Nat;
        rental : Nat;
        underConstruction : Nat;
      };
      propertyTypeDistribution : {
        residential : Nat;
        commercial : Nat;
        industrial : Nat;
      };
      configurationDistribution : {
        rk1 : Nat;
        bhk1 : Nat;
        bhk1_5 : Nat;
        bhk2 : Nat;
        bhk2_5 : Nat;
        bhk3 : Nat;
        bhk3_5 : Nat;
        bhk4 : Nat;
        bhk5 : Nat;
        jodiFlat : Nat;
        duplex : Nat;
        penthouse : Nat;
        bungalow : Nat;
        independentHouse : Nat;
      };
      furnishingDistribution : {
        unfurnished : Nat;
        semiFurnished : Nat;
        furnished : Nat;
      };
      averagePrice : ?Nat;
      priceRange : {
        minPrice : ?Nat;
        maxPrice : ?Nat;
      };
    };

    public type CategoryDistribution = {
      region : Text;
      regionType : RegionType;
      resaleCount : Nat;
      rentalCount : Nat;
      underConstructionCount : Nat;
    };

    public type PropertyTypeDistribution = {
      region : Text;
      regionType : RegionType;
      residentialCount : Nat;
      commercialCount : Nat;
      industrialCount : Nat;
    };

    public type ConfigurationDistribution = {
      region : Text;
      regionType : RegionType;
      rk1Count : Nat;
      bhk1Count : Nat;
      bhk1_5Count : Nat;
      bhk2Count : Nat;
      bhk2_5Count : Nat;
      bhk3Count : Nat;
      bhk3_5Count : Nat;
      bhk4Count : Nat;
      bhk5Count : Nat;
      jodiFlatCount : Nat;
      duplexCount : Nat;
      penthouseCount : Nat;
      bungalowCount : Nat;
      independentHouseCount : Nat;
    };

    public type FurnishingDistribution = {
      region : Text;
      regionType : RegionType;
      unfurnishedCount : Nat;
      semiFurnishedCount : Nat;
      furnishedCount : Nat;
    };

    public type RegionType = {
      #city;
      #suburb;
      #area;
      #neighborhood;
      #zone;
    };

    public type CombinedAnalytics = {
      regionalDistribution : [RegionalDistribution];
      propertyDensity : [PropertyDensity];
      pricingHeatmap : [PricingHeatmap];
      categoryDistribution : [CategoryDistribution];
      propertyTypeDistribution : [PropertyTypeDistribution];
      configurationDistribution : [ConfigurationDistribution];
      furnishingDistribution : [FurnishingDistribution];
    };
  };

  module Agent {
    public type Role = {
      #admin;
      #agent;
      #assistant;
      #juniorAgent;
    };

    public type Profile = {
      id : Principal;
      name : Text;
      contactInfo : Text;
      role : Role;
      active : Bool;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };
  };

  module Inquiry {
    public type Source = {
      #website;
      #referral;
      #walkIn;
      #phone;
      #socialMedia;
    };

    public type Status = {
      #new;
      #inProgress;
      #closed;
      #followUp;
    };

    public type Inquiry = {
      id : Text;
      propertyId : Text;
      customerName : Text;
      contactInfo : Text;
      source : Source;
      status : Status;
      assignedAgent : Principal;
      notes : Text;
      createdAt : Time.Time;
      updatedAt : Time.Time;
    };
  };

  public type UserProfile = {
    name : Text;
    contactInfo : Text;
  };

  var agents = Map.empty<Principal, Agent.Profile>();
  var properties = Map.empty<Text, Property.Property>();
  var inquiries = Map.empty<Text, Inquiry.Inquiry>();
  var userProfiles = Map.empty<Principal, UserProfile>();

  private func getAgentRole(principal : Principal) : ?Agent.Role {
    switch (agents.get(principal)) {
      case (null) { null };
      case (?agent) {
        if (agent.active) { ?agent.role } else { null };
      };
    };
  };

  private func isValidActiveAgent(principal : Principal) : Bool {
    switch (agents.get(principal)) {
      case (null) { false };
      case (?agent) { agent.active };
    };
  };

  private func canManageProperties(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?role) {
        role == #admin or role == #agent or role == #juniorAgent;
      };
    };
  };

  private func canViewProperties(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  private func hasAgentRole(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  private func canAccessAnalytics(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?role) {
        role == #admin or role == #agent or role == #juniorAgent;
      };
    };
  };

  private func canManageInquiries(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?role) {
        role == #admin or role == #agent or role == #juniorAgent or role == #assistant;
      };
    };
  };

  private func canManageAllInquiries(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?role) {
        role == #admin or role == #agent;
      };
    };
  };

  private func canAssignToOtherAgents(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) { return true };
    switch (getAgentRole(caller)) {
      case (null) { false };
      case (?role) {
        role == #admin or role == #agent or role == #juniorAgent;
      };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Agent Management
  public shared ({ caller }) func addAgent(
    agentPrincipal : Principal,
    name : Text,
    contactInfo : Text,
    role : Agent.Role,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add agents");
    };

    let agent : Agent.Profile = {
      id = agentPrincipal;
      name;
      contactInfo;
      role;
      active = true;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    agents.add(agentPrincipal, agent);

    // Sync with AccessControl system - assign user role to enable authentication
    AccessControl.assignRole(accessControlState, caller, agentPrincipal, #user);
  };

  public shared ({ caller }) func updateAgent(
    agentId : Principal,
    name : Text,
    contactInfo : Text,
    role : Agent.Role,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update agents");
    };

    switch (agents.get(agentId)) {
      case (null) { Runtime.trap("Agent does not exist") };
      case (?existingAgent) {
        let updatedAgent : Agent.Profile = {
          id = agentId;
          name;
          contactInfo;
          role;
          active = existingAgent.active;
          createdAt = existingAgent.createdAt;
          updatedAt = Time.now();
        };
        agents.add(agentId, updatedAgent);
      };
    };
  };

  public shared ({ caller }) func deactivateAgent(agentId : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate agents");
    };

    switch (agents.get(agentId)) {
      case (null) { Runtime.trap("Agent does not exist") };
      case (?existingAgent) {
        let updatedAgent : Agent.Profile = {
          id = agentId;
          name = existingAgent.name;
          contactInfo = existingAgent.contactInfo;
          role = existingAgent.role;
          active = false;
          createdAt = existingAgent.createdAt;
          updatedAt = Time.now();
        };
        agents.add(agentId, updatedAgent);
      };
    };
  };

  public query ({ caller }) func getAgent(agentId : Principal) : async Agent.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view agents");
    };

    // Agents can view other agent profiles for collaboration and inquiry assignment
    if (not hasAgentRole(caller)) {
      Runtime.trap("Unauthorized: Only agents can view agent profiles");
    };

    switch (agents.get(agentId)) {
      case (null) { Runtime.trap("Agent does not exist") };
      case (?agent) { agent };
    };
  };

  public query ({ caller }) func getAllAgents() : async [Agent.Profile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view agents");
    };

    // Agents can view other agent profiles for collaboration and inquiry assignment
    if (not hasAgentRole(caller)) {
      Runtime.trap("Unauthorized: Only agents can view agent profiles");
    };

    agents.values().toArray().sort(
      func(a1, a2) { Int.compare(a1.createdAt, a2.createdAt) }
    );
  };

  // Property Management
  public shared ({ caller }) func addProperty(
    title : Text,
    description : Text,
    location : Property.Location,
    coordinates : Property.Coordinates,
    price : Nat,
    category : Property.Category,
    propertyType : Property.PropertyType,
    configuration : Property.Configuration,
    furnishing : Property.Furnishing,
    images : [Storage.ExternalBlob],
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add properties");
    };

    if (not canManageProperties(caller)) {
      Runtime.trap("Unauthorized: Only admins, agents, and junior agents can add properties");
    };

    let propertyId = location.city # "." # location.suburb # "." # location.area # "." # location.roadName # "." # price.toText() # "." # Time.now().toText();

    let property : Property.Property = {
      id = propertyId;
      title;
      description;
      location;
      coordinates;
      price;
      category;
      propertyType;
      configuration;
      furnishing;
      status = #available;
      listedBy = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
      images;
    };

    properties.add(propertyId, property);
    propertyId;
  };

  public shared ({ caller }) func updateProperty(
    propertyId : Text,
    title : Text,
    description : Text,
    location : Property.Location,
    coordinates : Property.Coordinates,
    price : Nat,
    category : Property.Category,
    propertyType : Property.PropertyType,
    configuration : Property.Configuration,
    furnishing : Property.Furnishing,
    status : Property.Status,
    images : [Storage.ExternalBlob],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update properties");
    };

    switch (properties.get(propertyId)) {
      case (null) { Runtime.trap("Property does not exist") };
      case (?existingProperty) {
        if (not canManageProperties(caller)) {
          Runtime.trap("Unauthorized: Only admins, agents, and junior agents can update properties");
        };

        // Only admins can update any property; others can only update their own
        if (existingProperty.listedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own properties");
        };

        let updatedProperty : Property.Property = {
          id = propertyId;
          title;
          description;
          location;
          coordinates;
          price;
          category;
          propertyType;
          configuration;
          furnishing;
          status;
          listedBy = existingProperty.listedBy;
          createdAt = existingProperty.createdAt;
          updatedAt = Time.now();
          images;
        };
        properties.add(propertyId, updatedProperty);
      };
    };
  };

  public query ({ caller }) func getProperty(propertyId : Text) : async Property.Property {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view properties");
    };

    // Only users with agent roles (including assistants) can view properties
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can view properties");
    };

    switch (properties.get(propertyId)) {
      case (null) { Runtime.trap("Property does not exist") };
      case (?property) { property };
    };
  };

  public query ({ caller }) func getAllProperties() : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view properties");
    };

    // Only users with agent roles (including assistants) can view properties
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can view properties");
    };

    properties.values().toArray().sort(
      func(p1, p2) { Int.compare(p1.createdAt, p2.createdAt) }
    );
  };

  public query ({ caller }) func getPropertiesByCategory(category : Property.Category) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view properties");
    };

    // Only users with agent roles (including assistants) can view properties
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can view properties");
    };

    properties.values().toArray().filter(func(p) { p.category == category }).sort(
      func(p1, p2) { Int.compare(p1.createdAt, p2.createdAt) }
    );
  };

  public query ({ caller }) func getPropertiesByPropertyType(
    propertyType : Property.PropertyType,
  ) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view properties");
    };

    // Only users with agent roles (including assistants) can view properties
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can view properties");
    };

    properties.values().toArray().filter(
      func(p) { p.propertyType == propertyType }
    ).sort(
      func(p1, p2) { Int.compare(p1.createdAt, p2.createdAt) }
    );
  };

  public query ({ caller }) func getPropertiesByCategoryAndType(
    category : Property.Category,
    propertyType : Property.PropertyType,
  ) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view properties");
    };

    // Only users with agent roles (including assistants) can view properties
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can view properties");
    };

    properties.values().toArray().filter(
      func(p) {
        p.category == category and p.propertyType == propertyType
      }
    ).sort(
      func(p1, p2) { Int.compare(p1.createdAt, p2.createdAt) }
    );
  };

  // Filtering and Analytics for Configuration
  public query ({ caller }) func filterPropertiesByConfiguration(
    configuration : Property.Configuration,
  ) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter properties");
    };

    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can filter properties");
    };

    properties.values().toArray().filter(func(p) { p.configuration == configuration });
  };

  public query ({ caller }) func filterPropertiesByCategoryAndConfig(
    category : Property.Category,
    configuration : Property.Configuration,
  ) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter properties");
    };

    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can filter properties");
    };

    properties.values().toArray().filter(
      func(p) {
        p.category == category and p.configuration == configuration
      }
    );
  };

  // Advanced Property Filtering for Map Integration
  public query ({ caller }) func searchAndFilterProperties(
    criteria : Property.SearchCriteria,
  ) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can search properties");
    };

    // Only users with agent roles can search properties
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can search properties");
    };

    properties.values().toArray().filter(
      func(p) {
        let cityMatch = switch (criteria.city) {
          case (null) { true };
          case (?city) { p.location.city == city };
        };
        let suburbMatch = switch (criteria.suburb) {
          case (null) { true };
          case (?suburb) { p.location.suburb == suburb };
        };
        let areaMatch = switch (criteria.area) {
          case (null) { true };
          case (?area) { p.location.area == area };
        };
        let roadNameMatch = switch (criteria.roadName) {
          case (null) { true };
          case (?roadName) { p.location.roadName == roadName };
        };
        let categoryMatch = switch (criteria.category) {
          case (null) { true };
          case (?category) { p.category == category };
        };
        let propertyTypeMatch = switch (criteria.propertyType) {
          case (null) { true };
          case (?propertyType) {
            p.propertyType == propertyType;
          };
        };
        let configurationMatch = switch (criteria.configuration) {
          case (null) { true };
          case (?configuration) { p.configuration == configuration };
        };
        let furnishingMatch = switch (criteria.furnishing) {
          case (null) { true };
          case (?furnishing) { p.furnishing == furnishing };
        };
        let priceMatch = switch (criteria.minPrice, criteria.maxPrice) {
          case (null, null) { true };
          case (null, ?maxPrice) { p.price <= maxPrice };
          case (?minPrice, null) { p.price >= minPrice };
          case (?minPrice, ?maxPrice) { p.price >= minPrice and p.price <= maxPrice };
        };
        let statusMatch = switch (criteria.status) {
          case (null) { true };
          case (?status) { p.status == status };
        };
        let radiusMatch = switch (criteria.lat, criteria.lng, criteria.radius) {
          case (null, _, _) { true };
          case (_, null, _) { true };
          case (_, _, null) { true };
          case (?lat, ?lng, ?radius) {
            let dLat = lat - p.coordinates.lat;
            let dLng = lng - p.coordinates.lng;
            (dLat * dLat + dLng * dLng) <= (radius * radius);
          };
        };

        cityMatch and suburbMatch and areaMatch and roadNameMatch and categoryMatch and propertyTypeMatch and configurationMatch and furnishingMatch and priceMatch and statusMatch and radiusMatch
      }
    );
  };

  // Enhanced Filtering - Advanced Combination Search
  public query ({ caller }) func advancedFilterProperties(
    advancedFilters : Property.AdvancedFilter,
  ) : async [Property.Property] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can perform advanced filtering");
    };

    // Only users with agent roles can perform advanced filtering
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can perform advanced filtering");
    };

    let propertiesArray = properties.values().toArray();

    func intersectProperties(array1 : [Property.Property], array2 : [Property.Property]) : [Property.Property] {
      let set1 = Set.fromArray(array1.map(func(p) { p.id }));
      let set2 = Set.fromArray(array2.map(func(p) { p.id }));
      let intersectionSet = Set.empty<Text>();

      for (id in set1.values()) {
        if (set2.contains(id)) {
          intersectionSet.add(id);
        };
      };

      let intersectionIds = intersectionSet.toArray();

      var result = Array.empty<Property.Property>();
      for (property in propertiesArray.values()) {
        var found = false;
        for (id in intersectionIds.values()) {
          if (property.id == id) {
            found := true;
          };
        };
        if (found) {
          result := result.concat([property]);
        };
      };
      result;
    };

    let locationFiltered = if (advancedFilters.locations.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (loc in advancedFilters.locations.vals()) {
        let filtered = propertiesArray.filter(
          func(p) {
            p.location.city == loc.city and p.location.suburb == loc.suburb and p.location.area == loc.area and p.location.roadName == loc.roadName
          }
        );
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let categoryFiltered = if (advancedFilters.categories.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (cat in advancedFilters.categories.vals()) {
        let filtered = propertiesArray.filter(func(p) { p.category == cat });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let propertyTypeFiltered = if (advancedFilters.propertyTypes.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (propertyType in advancedFilters.propertyTypes.vals()) {
        let filtered = propertiesArray.filter(func(p) { p.propertyType == propertyType });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let configurationFiltered = if (advancedFilters.configurations.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (config in advancedFilters.configurations.vals()) {
        let filtered = propertiesArray.filter(func(p) { p.configuration == config });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let furnishingFiltered = if (advancedFilters.furnishings.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (furnishing in advancedFilters.furnishings.vals()) {
        let filtered = propertiesArray.filter(func(p) { p.furnishing == furnishing });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let priceFiltered = if (advancedFilters.priceRanges.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for ((minPrice, maxPrice) in advancedFilters.priceRanges.vals()) {
        let filtered = propertiesArray.filter(func(p) {
          switch (minPrice, maxPrice) {
            case (null, null) { true };
            case (null, ?max) { p.price <= max };
            case (?min, null) { p.price >= min };
            case (?min, ?max) { p.price >= min and p.price <= max };
          };
        });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let statusFiltered = if (advancedFilters.statuses.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (status in advancedFilters.statuses.vals()) {
        let filtered = propertiesArray.filter(func(p) { p.status == status });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let coordinatesFiltered = if (advancedFilters.coordinateFilters.size() > 0) {
      var combined = Array.empty<Property.Property>();
      for (coord in advancedFilters.coordinateFilters.vals()) {
        let filtered = propertiesArray.filter(func(p) {
          let dLat = coord.lat - p.coordinates.lat;
          let dLng = coord.lng - p.coordinates.lng;
          (dLat * dLat + dLng * dLng) <= (coord.radius * coord.radius);
        });
        combined := combined.concat(filtered);
      };
      combined;
    } else {
      propertiesArray;
    };

    let result = intersectProperties(
      intersectProperties(
        intersectProperties(
          intersectProperties(
            intersectProperties(
              intersectProperties(
                intersectProperties(locationFiltered, categoryFiltered),
                propertyTypeFiltered,
              ),
              configurationFiltered,
            ),
            furnishingFiltered,
          ),
          priceFiltered,
        ),
        statusFiltered,
      ),
      coordinatesFiltered,
    );

    result;
  };

  public query ({ caller }) func getAllCities() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access location data");
    };

    // Only users with agent roles can access location data
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can access location data");
    };

    let cities = properties.values().toArray().map(func(p) { p.location.city });

    let citySet = Set.fromArray(cities);
    citySet.toArray();
  };

  public query ({ caller }) func getSuburbsForCity(city : Text) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access location data");
    };

    // Only users with agent roles can access location data
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can access location data");
    };

    let suburbs = properties.values().toArray().filter(
      func(p) { p.location.city == city }
    ).map(func(p) { p.location.suburb });

    let suburbSet = Set.fromArray(suburbs);
    suburbSet.toArray();
  };

  public query ({ caller }) func getAreasForSuburb(city : Text, suburb : Text) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access location data");
    };

    // Only users with agent roles can access location data
    if (not canViewProperties(caller)) {
      Runtime.trap("Unauthorized: Only agents can access location data");
    };

    let areas = properties.values().toArray().filter(
      func(p) { p.location.city == city and p.location.suburb == suburb }
    ).map(func(p) { p.location.area });

    let areaSet = Set.fromArray(areas);
    areaSet.toArray();
  };

  // Inquiry Management
  public shared ({ caller }) func addInquiry(
    propertyId : Text,
    customerName : Text,
    contactInfo : Text,
    source : Inquiry.Source,
    assignedAgent : Principal,
    notes : Text,
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add inquiries");
    };

    // All agent roles can add inquiries
    if (not canManageInquiries(caller)) {
      Runtime.trap("Unauthorized: Only agents can add inquiries");
    };

    // Validate that the property exists
    switch (properties.get(propertyId)) {
      case (null) { Runtime.trap("Property does not exist") };
      case (?_) {};
    };

    // Validate that the assigned agent is a valid, active agent
    if (not isValidActiveAgent(assignedAgent)) {
      Runtime.trap("Assigned agent is not a valid or active agent");
    };

    // Assistants can only assign inquiries to themselves
    if (not canAssignToOtherAgents(caller) and assignedAgent != caller) {
      Runtime.trap("Unauthorized: Assistants can only assign inquiries to themselves");
    };

    let inquiryId = propertyId # "." # customerName # "." # Time.now().toText();

    let inquiry : Inquiry.Inquiry = {
      id = inquiryId;
      propertyId;
      customerName;
      contactInfo;
      source;
      status = #new;
      assignedAgent;
      notes;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    inquiries.add(inquiryId, inquiry);
    inquiryId;
  };

  public shared ({ caller }) func updateInquiry(
    inquiryId : Text,
    customerName : Text,
    contactInfo : Text,
    source : Inquiry.Source,
    status : Inquiry.Status,
    assignedAgent : Principal,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update inquiries");
    };

    switch (inquiries.get(inquiryId)) {
      case (null) { Runtime.trap("Inquiry does not exist") };
      case (?existingInquiry) {
        if (not canManageInquiries(caller)) {
          Runtime.trap("Unauthorized: Only agents can update inquiries");
        };

        // Assistants can only update inquiries assigned to them
        // Agents and admins can update any inquiry
        if (existingInquiry.assignedAgent != caller and not canManageAllInquiries(caller)) {
          Runtime.trap("Unauthorized: Can only update inquiries assigned to you");
        };

        // Validate that the assigned agent is a valid, active agent
        if (not isValidActiveAgent(assignedAgent)) {
          Runtime.trap("Assigned agent is not a valid or active agent");
        };

        // Assistants can only reassign inquiries to themselves
        if (not canAssignToOtherAgents(caller) and assignedAgent != caller) {
          Runtime.trap("Unauthorized: Assistants can only assign inquiries to themselves");
        };

        let updatedInquiry : Inquiry.Inquiry = {
          id = inquiryId;
          propertyId = existingInquiry.propertyId;
          customerName;
          contactInfo;
          source;
          status;
          assignedAgent;
          notes;
          createdAt = existingInquiry.createdAt;
          updatedAt = Time.now();
        };
        inquiries.add(inquiryId, updatedInquiry);
      };
    };
  };

  public query ({ caller }) func getInquiry(inquiryId : Text) : async Inquiry.Inquiry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view inquiries");
    };

    if (not canManageInquiries(caller)) {
      Runtime.trap("Unauthorized: Only agents can view inquiries");
    };

    switch (inquiries.get(inquiryId)) {
      case (null) { Runtime.trap("Inquiry does not exist") };
      case (?inquiry) {
        // Assistants can only view inquiries assigned to them
        // Agents and admins can view any inquiry
        if (inquiry.assignedAgent != caller and not canManageAllInquiries(caller)) {
          Runtime.trap("Unauthorized: Can only view inquiries assigned to you");
        };
        inquiry;
      };
    };
  };

  public query ({ caller }) func getAllInquiries() : async [Inquiry.Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view inquiries");
    };

    if (not canManageInquiries(caller)) {
      Runtime.trap("Unauthorized: Only agents can view inquiries");
    };

    let allInquiries = inquiries.values().toArray();

    // Assistants can only see inquiries assigned to them
    // Agents and admins can see all inquiries
    if (canManageAllInquiries(caller)) {
      allInquiries.sort(
        func(i1, i2) { Int.compare(i1.createdAt, i2.createdAt) }
      );
    } else {
      allInquiries.filter(func(i) { i.assignedAgent == caller }).sort(
        func(i1, i2) { Int.compare(i1.createdAt, i2.createdAt) }
      );
    };
  };

  public query ({ caller }) func getInquiriesByAgent(agentId : Principal) : async [Inquiry.Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view inquiries");
    };

    if (not canManageInquiries(caller)) {
      Runtime.trap("Unauthorized: Only agents can view inquiries");
    };

    // Only admins and agents can view other agents' inquiries
    // Assistants can only view their own
    if (agentId != caller and not canManageAllInquiries(caller)) {
      Runtime.trap("Unauthorized: Can only view your own inquiries");
    };

    inquiries.values().toArray().filter(
      func(i) { i.assignedAgent == agentId }
    ).sort(
      func(i1, i2) { Int.compare(i1.createdAt, i2.createdAt) }
    );
  };

  public query ({ caller }) func getInquiriesByProperty(propertyId : Text) : async [Inquiry.Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view inquiries");
    };

    if (not canManageInquiries(caller)) {
      Runtime.trap("Unauthorized: Only agents can view inquiries");
    };

    let propertyInquiries = inquiries.values().toArray().filter(
      func(i) { i.propertyId == propertyId }
    );

    // Assistants can only see inquiries assigned to them
    // Agents and admins can see all inquiries for the property
    if (canManageAllInquiries(caller)) {
      propertyInquiries.sort(
        func(i1, i2) { Int.compare(i1.createdAt, i2.createdAt) }
      );
    } else {
      propertyInquiries.filter(func(i) { i.assignedAgent == caller }).sort(
        func(i1, i2) { Int.compare(i1.createdAt, i2.createdAt) }
      );
    };
  };

  // Analytics and Configuration Distribution
  public query ({ caller }) func getConfigurationDistribution() : async [Analytics.ConfigurationDistribution] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access analytics");
    };

    // Only admins, agents, and juniorAgents can access analytics (NOT assistants)
    if (not canAccessAnalytics(caller)) {
      Runtime.trap("Unauthorized: Only admins, agents, and junior agents can access analytics");
    };

    // Agents see analytics for their own properties only
    // Admins see all analytics
    let relevantProperties = if (AccessControl.isAdmin(accessControlState, caller)) {
      properties.values().toArray();
    } else {
      properties.values().toArray().filter(func(p) { p.listedBy == caller });
    };

    [{
      region = "Mumbai";
      regionType = #city;
      rk1Count = relevantProperties.filter(func(p) { p.configuration == #rk1 }).size();
      bhk1Count = relevantProperties.filter(func(p) { p.configuration == #bhk1 }).size();
      bhk1_5Count = relevantProperties.filter(func(p) { p.configuration == #bhk1_5 }).size();
      bhk2Count = relevantProperties.filter(func(p) { p.configuration == #bhk2 }).size();
      bhk2_5Count = relevantProperties.filter(func(p) { p.configuration == #bhk2_5 }).size();
      bhk3Count = relevantProperties.filter(func(p) { p.configuration == #bhk3 }).size();
      bhk3_5Count = relevantProperties.filter(func(p) { p.configuration == #bhk3_5 }).size();
      bhk4Count = relevantProperties.filter(func(p) { p.configuration == #bhk4 }).size();
      bhk5Count = relevantProperties.filter(func(p) { p.configuration == #bhk5 }).size();
      jodiFlatCount = relevantProperties.filter(func(p) { p.configuration == #jodiFlat }).size();
      duplexCount = relevantProperties.filter(func(p) { p.configuration == #duplex }).size();
      penthouseCount = relevantProperties.filter(func(p) { p.configuration == #penthouse }).size();
      bungalowCount = relevantProperties.filter(func(p) { p.configuration == #bungalow }).size();
      independentHouseCount = relevantProperties.filter(func(p) { p.configuration == #independentHouse }).size();
    }];
  };

  public query ({ caller }) func getFurnishingDistribution() : async [Analytics.FurnishingDistribution] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access analytics");
    };

    // Only admins, agents, and juniorAgents can access analytics (NOT assistants)
    if (not canAccessAnalytics(caller)) {
      Runtime.trap("Unauthorized: Only admins, agents, and junior agents can access analytics");
    };

    // Agents see analytics for their own properties only
    // Admins see all analytics
    let relevantProperties = if (AccessControl.isAdmin(accessControlState, caller)) {
      properties.values().toArray();
    } else {
      properties.values().toArray().filter(func(p) { p.listedBy == caller });
    };

    [{
      region = "Mumbai";
      regionType = #city;
      unfurnishedCount = relevantProperties.filter(func(p) { p.furnishing == #unfurnished }).size();
      semiFurnishedCount = relevantProperties.filter(func(p) { p.furnishing == #semiFurnished }).size();
      furnishedCount = relevantProperties.filter(func(p) { p.furnishing == #furnished }).size();
    }];
  };

  public query ({ caller }) func getCombinedAnalytics() : async Analytics.CombinedAnalytics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access analytics");
    };

    // Only admins, agents, and juniorAgents can access analytics (NOT assistants)
    if (not canAccessAnalytics(caller)) {
      Runtime.trap("Unauthorized: Only admins, agents, and junior agents can access analytics");
    };

    // Agents see analytics for their own properties only
    // Admins see all analytics
    let relevantProperties = if (AccessControl.isAdmin(accessControlState, caller)) {
      properties.values().toArray();
    } else {
      properties.values().toArray().filter(func(p) { p.listedBy == caller });
    };

    let totalCount = relevantProperties.size();
    let resaleCount = relevantProperties.filter(func(p) { p.category == #resale }).size();
    let rentalCount = relevantProperties.filter(func(p) { p.category == #rental }).size();
    let underConstructionCount = relevantProperties.filter(func(p) { p.category == #underConstruction }).size();
    let residentialCount = relevantProperties.filter(func(p) { p.propertyType == #residential }).size();
    let commercialCount = relevantProperties.filter(func(p) { p.propertyType == #commercial }).size();
    let industrialCount = relevantProperties.filter(func(p) { p.propertyType == #industrial }).size();

    let avgPrice = if (totalCount > 0) {
      var sum : Nat = 0;
      for (p in relevantProperties.vals()) {
        sum += p.price;
      };
      ?(sum / totalCount);
    } else {
      null;
    };

    let regionalDistribution = [{
      region = "Mumbai";
      regionType = #city;
      propertyCount = totalCount;
      categoryDistribution = {
        resale = resaleCount;
        rental = rentalCount;
        underConstruction = underConstructionCount;
      };
      propertyTypeDistribution = {
        residential = residentialCount;
        commercial = commercialCount;
        industrial = industrialCount;
      };
      configurationDistribution = {
        rk1 = relevantProperties.filter(func(p) { p.configuration == #rk1 }).size();
        bhk1 = relevantProperties.filter(func(p) { p.configuration == #bhk1 }).size();
        bhk1_5 = relevantProperties.filter(func(p) { p.configuration == #bhk1_5 }).size();
        bhk2 = relevantProperties.filter(func(p) { p.configuration == #bhk2 }).size();
        bhk2_5 = relevantProperties.filter(func(p) { p.configuration == #bhk2_5 }).size();
        bhk3 = relevantProperties.filter(func(p) { p.configuration == #bhk3 }).size();
        bhk3_5 = relevantProperties.filter(func(p) { p.configuration == #bhk3_5 }).size();
        bhk4 = relevantProperties.filter(func(p) { p.configuration == #bhk4 }).size();
        bhk5 = relevantProperties.filter(func(p) { p.configuration == #bhk5 }).size();
        jodiFlat = relevantProperties.filter(func(p) { p.configuration == #jodiFlat }).size();
        duplex = relevantProperties.filter(func(p) { p.configuration == #duplex }).size();
        penthouse = relevantProperties.filter(func(p) { p.configuration == #penthouse }).size();
        bungalow = relevantProperties.filter(func(p) { p.configuration == #bungalow }).size();
        independentHouse = relevantProperties.filter(func(p) { p.configuration == #independentHouse }).size();
      };
      furnishingDistribution = {
        unfurnished = relevantProperties.filter(func(p) { p.furnishing == #unfurnished }).size();
        semiFurnished = relevantProperties.filter(func(p) { p.furnishing == #semiFurnished }).size();
        furnished = relevantProperties.filter(func(p) { p.furnishing == #furnished }).size();
      };
      averagePrice = avgPrice;
      priceRange = {
        minPrice = if (totalCount > 0) { ?relevantProperties[0].price } else { null };
        maxPrice = if (totalCount > 0) { ?relevantProperties[0].price } else { null };
      };
    }];

    let propertyDensity = [{
      region = "Mumbai";
      regionType = #city;
      propertyCount = totalCount;
    }];

    let pricingHeatmap = [{
      region = "Mumbai";
      regionType = #city;
      averagePrice = avgPrice;
      priceRange = {
        minPrice = if (totalCount > 0) { ?relevantProperties[0].price } else { null };
        maxPrice = if (totalCount > 0) { ?relevantProperties[0].price } else { null };
      };
    }];

    let categoryDistribution = [{
      region = "Mumbai";
      regionType = #city;
      resaleCount;
      rentalCount;
      underConstructionCount;
    }];

    let propertyTypeDistribution = [{
      region = "Mumbai";
      regionType = #city;
      residentialCount;
      commercialCount;
      industrialCount;
    }];

    let configurationDistribution = [{
      region = "Mumbai";
      regionType = #city;
      rk1Count = relevantProperties.filter(func(p) { p.configuration == #rk1 }).size();
      bhk1Count = relevantProperties.filter(func(p) { p.configuration == #bhk1 }).size();
      bhk1_5Count = relevantProperties.filter(func(p) { p.configuration == #bhk1_5 }).size();
      bhk2Count = relevantProperties.filter(func(p) { p.configuration == #bhk2 }).size();
      bhk2_5Count = relevantProperties.filter(func(p) { p.configuration == #bhk2_5 }).size();
      bhk3Count = relevantProperties.filter(func(p) { p.configuration == #bhk3 }).size();
      bhk3_5Count = relevantProperties.filter(func(p) { p.configuration == #bhk3_5 }).size();
      bhk4Count = relevantProperties.filter(func(p) { p.configuration == #bhk4 }).size();
      bhk5Count = relevantProperties.filter(func(p) { p.configuration == #bhk5 }).size();
      jodiFlatCount = relevantProperties.filter(func(p) { p.configuration == #jodiFlat }).size();
      duplexCount = relevantProperties.filter(func(p) { p.configuration == #duplex }).size();
      penthouseCount = relevantProperties.filter(func(p) { p.configuration == #penthouse }).size();
      bungalowCount = relevantProperties.filter(func(p) { p.configuration == #bungalow }).size();
      independentHouseCount = relevantProperties.filter(func(p) { p.configuration == #independentHouse }).size();
    }];

    let furnishingDistribution = [{
      region = "Mumbai";
      regionType = #city;
      unfurnishedCount = relevantProperties.filter(func(p) { p.furnishing == #unfurnished }).size();
      semiFurnishedCount = relevantProperties.filter(func(p) { p.furnishing == #semiFurnished }).size();
      furnishedCount = relevantProperties.filter(func(p) { p.furnishing == #furnished }).size();
    }];

    {
      regionalDistribution;
      propertyDensity;
      pricingHeatmap;
      categoryDistribution;
      propertyTypeDistribution;
      configurationDistribution;
      furnishingDistribution;
    };
  };

  // Data Reset Functionality
  public shared ({ caller }) func resetToFreshDraft() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reset the application");
    };

    agents := Map.empty<Principal, Agent.Profile>();
    properties := Map.empty<Text, Property.Property>();
    inquiries := Map.empty<Text, Inquiry.Inquiry>();
    userProfiles := Map.empty<Principal, UserProfile>();
  };
};

