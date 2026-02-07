import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    agents : Map.Map<Principal, { id : Principal; name : Text; contactInfo : Text; role : { #admin; #agent; #assistant; #juniorAgent }; active : Bool; createdAt : Int; updatedAt : Int }>;
    properties : Map.Map<Text, { id : Text; title : Text; description : Text; location : { city : Text; suburb : Text; area : Text; roadName : Text }; coordinates : { lat : Float; lng : Float }; price : Nat; category : { #resale; #rental; #underConstruction }; propertyType : { #residential; #commercial; #industrial }; configuration : { #rk1; #bhk1; #bhk1_5; #bhk2; #bhk2_5; #bhk3; #bhk3_5; #bhk4; #bhk5; #jodiFlat; #duplex; #penthouse; #bungalow; #independentHouse }; furnishing : { #unfurnished; #semiFurnished; #furnished }; status : { #available; #sold; #rented; #underContract }; listedBy : Principal; createdAt : Int; updatedAt : Int; images : [Storage.ExternalBlob] }>;
    inquiries : Map.Map<Text, { id : Text; propertyId : Text; customerName : Text; contactInfo : Text; source : { #website; #referral; #walkIn; #phone; #socialMedia }; status : { #new; #inProgress; #closed; #followUp }; assignedAgent : Principal; notes : Text; createdAt : Int; updatedAt : Int }>;
    userProfiles : Map.Map<Principal, { name : Text; contactInfo : Text }>;
  };

  type NewActor = {
    agents : Map.Map<Principal, { id : Principal; name : Text; contactInfo : Text; role : { #admin; #agent; #assistant; #juniorAgent }; active : Bool; createdAt : Int; updatedAt : Int }>;
    properties : Map.Map<Text, { id : Text; title : Text; description : Text; location : { city : Text; suburb : Text; area : Text; roadName : Text }; coordinates : { lat : Float; lng : Float }; price : Nat; category : { #resale; #rental; #underConstruction }; propertyType : { #residential; #commercial; #industrial }; configuration : { #rk1; #bhk1; #bhk1_5; #bhk2; #bhk2_5; #bhk3; #bhk3_5; #bhk4; #bhk5; #jodiFlat; #duplex; #penthouse; #bungalow; #independentHouse }; furnishing : { #unfurnished; #semiFurnished; #furnished }; status : { #available; #sold; #rented; #underContract }; listedBy : Principal; createdAt : Int; updatedAt : Int; images : [Storage.ExternalBlob] }>;
    inquiries : Map.Map<Text, { id : Text; propertyId : Text; customerName : Text; contactInfo : Text; source : { #website; #referral; #walkIn; #phone; #socialMedia }; status : { #new; #inProgress; #closed; #followUp }; assignedAgent : Principal; notes : Text; createdAt : Int; updatedAt : Int }>;
    userProfiles : Map.Map<Principal, { name : Text; contactInfo : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
