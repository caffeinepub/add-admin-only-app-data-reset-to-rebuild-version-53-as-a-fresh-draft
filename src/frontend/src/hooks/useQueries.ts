import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Profile, Property, Inquiry, Category, PropertyType, Configuration, Furnishing, Role, Source, Status, Status__1, Location, UserRole, Coordinates, SearchCriteria, CombinedAnalytics, ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// User Role Queries
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// Agent Queries
export function useGetAllAgents() {
  const { actor, isFetching } = useActor();

  return useQuery<Profile[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAgents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAgent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentPrincipal, name, contactInfo, role }: { agentPrincipal: Principal; name: string; contactInfo: string; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAgent(agentPrincipal, name, contactInfo, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add agent: ${error.message}`);
    },
  });
}

export function useUpdateAgent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, name, contactInfo, role }: { agentId: Principal; name: string; contactInfo: string; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAgent(agentId, name, contactInfo, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });
}

export function useDeactivateAgent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deactivateAgent(agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate agent: ${error.message}`);
    },
  });
}

// Property Queries
export function useGetAllProperties() {
  const { actor, isFetching } = useActor();

  return useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProperties();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchAndFilterProperties(criteria: SearchCriteria) {
  const { actor, isFetching } = useActor();

  return useQuery<Property[]>({
    queryKey: ['properties', 'filtered', criteria],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchAndFilterProperties(criteria);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProperty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, location, coordinates, price, category, propertyType, configuration, furnishing, images }: { title: string; description: string; location: Location; coordinates: Coordinates; price: bigint; category: Category; propertyType: PropertyType; configuration: Configuration; furnishing: Furnishing; images: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProperty(title, description, location, coordinates, price, category, propertyType, configuration, furnishing, images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add property: ${error.message}`);
    },
  });
}

export function useUpdateProperty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, title, description, location, coordinates, price, category, propertyType, configuration, furnishing, status, images }: { propertyId: string; title: string; description: string; location: Location; coordinates: Coordinates; price: bigint; category: Category; propertyType: PropertyType; configuration: Configuration; furnishing: Furnishing; status: Status; images: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProperty(propertyId, title, description, location, coordinates, price, category, propertyType, configuration, furnishing, status, images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update property: ${error.message}`);
    },
  });
}

// Inquiry Queries
export function useGetAllInquiries() {
  const { actor, isFetching } = useActor();

  return useQuery<Inquiry[]>({
    queryKey: ['inquiries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInquiries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddInquiry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, customerName, contactInfo, source, assignedAgent, notes }: { propertyId: string; customerName: string; contactInfo: string; source: Source; assignedAgent: Principal; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addInquiry(propertyId, customerName, contactInfo, source, assignedAgent, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success('Inquiry added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add inquiry: ${error.message}`);
    },
  });
}

export function useUpdateInquiry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inquiryId, customerName, contactInfo, source, status, assignedAgent, notes }: { inquiryId: string; customerName: string; contactInfo: string; source: Source; status: Status__1; assignedAgent: Principal; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInquiry(inquiryId, customerName, contactInfo, source, status, assignedAgent, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      toast.success('Inquiry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update inquiry: ${error.message}`);
    },
  });
}

// Analytics Queries
export function useGetCombinedAnalytics() {
  const { actor, isFetching } = useActor();

  return useQuery<CombinedAnalytics>({
    queryKey: ['combinedAnalytics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCombinedAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

// Reset to Fresh Draft Mutation
export function useResetToFreshDraft() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetToFreshDraft();
    },
    onSuccess: () => {
      // Invalidate all relevant query keys to refresh the entire app state
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['combinedAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      
      toast.success('Application data has been reset to fresh draft successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset application data: ${error.message}`);
    },
  });
}
