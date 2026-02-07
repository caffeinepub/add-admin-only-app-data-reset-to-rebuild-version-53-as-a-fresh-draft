import { useState } from 'react';
import { useGetAllInquiries, useGetAllProperties, useGetAllAgents, useAddInquiry, useUpdateInquiry } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
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
import { Plus, Edit, Loader2, AlertCircle } from 'lucide-react';
import { Source, Status__1, type Inquiry } from '../backend';
import { Principal } from '@dfinity/principal';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';

export default function InquiriesPage() {
  const { data: inquiries = [], isLoading } = useGetAllInquiries();
  const { data: properties = [] } = useGetAllProperties();
  const { data: agents = [] } = useGetAllAgents();
  const { identity } = useInternetIdentity();
  const addInquiry = useAddInquiry();
  const updateInquiry = useUpdateInquiry();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    customerName: '',
    contactInfo: '',
    source: Source.website,
    status: Status__1.new_,
    assignedAgent: '',
    notes: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: Record<string, string> = {};

    // Property is required for new inquiries
    if (!formData.propertyId && !isEdit) {
      errors.propertyId = 'Please select a property';
    }

    // Customer name is required
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    // Contact info is required and must be valid
    if (!formData.contactInfo.trim()) {
      errors.contactInfo = 'Contact information is required';
    } else {
      const contactValue = formData.contactInfo.trim();
      const isEmail = contactValue.includes('@');
      const phoneDigits = contactValue.replace(/\D/g, '');
      
      if (isEmail) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactValue)) {
          errors.contactInfo = 'Please enter a valid email address';
        }
      } else {
        // Phone number validation (10 digits)
        if (phoneDigits.length < 10) {
          errors.contactInfo = 'Please enter a valid phone number (at least 10 digits)';
        }
      }
    }

    // Assigned agent is required for edit
    if (isEdit && !formData.assignedAgent) {
      errors.assignedAgent = 'Please assign an agent';
    }

    // Notes are required
    if (!formData.notes.trim()) {
      errors.notes = 'Notes are required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    // Validate form
    if (!validateForm(false)) {
      toast.error('Please correct the errors in the form');
      return;
    }

    try {
      // Determine assigned agent
      const agentPrincipal = formData.assignedAgent 
        ? Principal.fromText(formData.assignedAgent)
        : identity?.getPrincipal() || Principal.anonymous();

      // Submit inquiry
      await addInquiry.mutateAsync({
        propertyId: formData.propertyId,
        customerName: formData.customerName.trim(),
        contactInfo: formData.contactInfo.trim(),
        source: formData.source,
        assignedAgent: agentPrincipal,
        notes: formData.notes.trim(),
      });

      // Close dialog and reset form
      setShowAddDialog(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding inquiry:', error);
      // Error toast is already handled by the mutation
    }
  };

  const handleEdit = async () => {
    // Validate form
    if (!selectedInquiry || !validateForm(true)) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    try {
      // Determine assigned agent
      const agentPrincipal = formData.assignedAgent 
        ? Principal.fromText(formData.assignedAgent)
        : selectedInquiry.assignedAgent;

      // Submit update
      await updateInquiry.mutateAsync({
        inquiryId: selectedInquiry.id,
        customerName: formData.customerName.trim(),
        contactInfo: formData.contactInfo.trim(),
        source: formData.source,
        status: formData.status,
        assignedAgent: agentPrincipal,
        notes: formData.notes.trim(),
      });

      // Close dialog and reset
      setShowEditDialog(false);
      setSelectedInquiry(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating inquiry:', error);
      // Error toast is already handled by the mutation
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: '',
      customerName: '',
      contactInfo: '',
      source: Source.website,
      status: Status__1.new_,
      assignedAgent: '',
      notes: '',
    });
    setValidationErrors({});
  };

  const openEditDialog = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setFormData({
      propertyId: inquiry.propertyId,
      customerName: inquiry.customerName,
      contactInfo: inquiry.contactInfo,
      source: inquiry.source,
      status: inquiry.status,
      assignedAgent: inquiry.assignedAgent.toString(),
      notes: inquiry.notes,
    });
    setValidationErrors({});
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: Status__1) => {
    const variants: Record<Status__1, 'default' | 'secondary' | 'outline'> = {
      [Status__1.new_]: 'default',
      [Status__1.inProgress]: 'outline',
      [Status__1.followUp]: 'secondary',
      [Status__1.closed]: 'secondary',
    };
    const labels: Record<Status__1, string> = {
      [Status__1.new_]: 'New',
      [Status__1.inProgress]: 'In Progress',
      [Status__1.followUp]: 'Follow Up',
      [Status__1.closed]: 'Closed',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getSourceBadge = (source: Source) => {
    const colors: Record<Source, string> = {
      [Source.website]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [Source.referral]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [Source.walkIn]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [Source.phone]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      [Source.socialMedia]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    const labels: Record<Source, string> = {
      [Source.website]: 'Website',
      [Source.referral]: 'Referral',
      [Source.walkIn]: 'Walk-in',
      [Source.phone]: 'Phone',
      [Source.socialMedia]: 'Social Media',
    };
    return <Badge className={colors[source]}>{labels[source]}</Badge>;
  };

  const filterByStatus = (status: Status__1 | 'all') => {
    if (status === 'all') return inquiries;
    return inquiries.filter((i) => i.status === status);
  };

  const getAgentName = (agentPrincipal: Principal): string => {
    const agent = agents.find(a => a.id.toString() === agentPrincipal.toString());
    return agent?.name || agentPrincipal.toString().substring(0, 10) + '...';
  };

  const getPropertyTitle = (propertyId: string): string => {
    const property = properties.find(p => p.id === propertyId);
    return property?.title || propertyId.substring(0, 30) + '...';
  };

  const InquiryTable = ({ inquiries }: { inquiries: Inquiry[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No inquiries found
              </TableCell>
            </TableRow>
          ) : (
            inquiries.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell className="font-medium">{inquiry.customerName}</TableCell>
                <TableCell className="text-sm">{inquiry.contactInfo}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{getPropertyTitle(inquiry.propertyId)}</TableCell>
                <TableCell>{getSourceBadge(inquiry.source)}</TableCell>
                <TableCell className="text-sm">{getAgentName(inquiry.assignedAgent)}</TableCell>
                <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(inquiry)}>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Inquiries Management</h1>
          <p className="text-muted-foreground">Track and manage customer inquiries</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Inquiry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="all">All ({inquiries.length})</TabsTrigger>
                <TabsTrigger value="new">New ({filterByStatus(Status__1.new_).length})</TabsTrigger>
                <TabsTrigger value="inProgress">In Progress ({filterByStatus(Status__1.inProgress).length})</TabsTrigger>
                <TabsTrigger value="followUp">Follow Up ({filterByStatus(Status__1.followUp).length})</TabsTrigger>
                <TabsTrigger value="closed">Closed ({filterByStatus(Status__1.closed).length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <InquiryTable inquiries={inquiries} />
              </TabsContent>
              <TabsContent value="new">
                <InquiryTable inquiries={filterByStatus(Status__1.new_)} />
              </TabsContent>
              <TabsContent value="inProgress">
                <InquiryTable inquiries={filterByStatus(Status__1.inProgress)} />
              </TabsContent>
              <TabsContent value="followUp">
                <InquiryTable inquiries={filterByStatus(Status__1.followUp)} />
              </TabsContent>
              <TabsContent value="closed">
                <InquiryTable inquiries={filterByStatus(Status__1.closed)} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Inquiry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Inquiry</DialogTitle>
            <DialogDescription>Record a new customer inquiry. All fields marked with * are required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.keys(validationErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please correct the errors below before submitting.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="add-property" className="text-sm font-medium">
                Property <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.propertyId} 
                onValueChange={(value) => {
                  setFormData({ ...formData, propertyId: value });
                  setValidationErrors({ ...validationErrors, propertyId: '' });
                }}
              >
                <SelectTrigger id="add-property" className={validationErrors.propertyId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No properties available
                    </div>
                  ) : (
                    properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {validationErrors.propertyId && (
                <p className="text-sm text-destructive">{validationErrors.propertyId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-customer" className="text-sm font-medium">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-customer"
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  setValidationErrors({ ...validationErrors, customerName: '' });
                }}
                placeholder="Enter customer's full name"
                className={validationErrors.customerName ? 'border-destructive' : ''}
              />
              {validationErrors.customerName && (
                <p className="text-sm text-destructive">{validationErrors.customerName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-contact" className="text-sm font-medium">
                Contact Information <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-contact"
                value={formData.contactInfo}
                onChange={(e) => {
                  setFormData({ ...formData, contactInfo: e.target.value });
                  setValidationErrors({ ...validationErrors, contactInfo: '' });
                }}
                placeholder="Email or phone number"
                className={validationErrors.contactInfo ? 'border-destructive' : ''}
              />
              {validationErrors.contactInfo && (
                <p className="text-sm text-destructive">{validationErrors.contactInfo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-source" className="text-sm font-medium">
                Inquiry Source <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value as Source })}>
                <SelectTrigger id="add-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Source.website}>Website</SelectItem>
                  <SelectItem value={Source.referral}>Referral</SelectItem>
                  <SelectItem value={Source.walkIn}>Walk-in</SelectItem>
                  <SelectItem value={Source.phone}>Phone</SelectItem>
                  <SelectItem value={Source.socialMedia}>Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-agent" className="text-sm font-medium">
                Assign to Agent
              </Label>
              <Select value={formData.assignedAgent} onValueChange={(value) => setFormData({ ...formData, assignedAgent: value })}>
                <SelectTrigger id="add-agent">
                  <SelectValue placeholder="Assign to me (default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Assign to me (default)</SelectItem>
                  {agents.filter(a => a.active).map((agent) => (
                    <SelectItem key={agent.id.toString()} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If no agent is selected, the inquiry will be assigned to you
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-notes" className="text-sm font-medium">
                Notes <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="add-notes"
                value={formData.notes}
                onChange={(e) => {
                  setFormData({ ...formData, notes: e.target.value });
                  setValidationErrors({ ...validationErrors, notes: '' });
                }}
                placeholder="Add any additional notes about this inquiry"
                rows={3}
                className={validationErrors.notes ? 'border-destructive' : ''}
              />
              {validationErrors.notes && (
                <p className="text-sm text-destructive">{validationErrors.notes}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={addInquiry.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addInquiry.isPending}
            >
              {addInquiry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inquiry Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) { setSelectedInquiry(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Inquiry</DialogTitle>
            <DialogDescription>Update inquiry details and status. All fields marked with * are required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {Object.keys(validationErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please correct the errors below before submitting.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-customer" className="text-sm font-medium">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-customer"
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  setValidationErrors({ ...validationErrors, customerName: '' });
                }}
                placeholder="Enter customer's full name"
                className={validationErrors.customerName ? 'border-destructive' : ''}
              />
              {validationErrors.customerName && (
                <p className="text-sm text-destructive">{validationErrors.customerName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact" className="text-sm font-medium">
                Contact Information <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-contact"
                value={formData.contactInfo}
                onChange={(e) => {
                  setFormData({ ...formData, contactInfo: e.target.value });
                  setValidationErrors({ ...validationErrors, contactInfo: '' });
                }}
                placeholder="Email or phone number"
                className={validationErrors.contactInfo ? 'border-destructive' : ''}
              />
              {validationErrors.contactInfo && (
                <p className="text-sm text-destructive">{validationErrors.contactInfo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-source" className="text-sm font-medium">
                Inquiry Source <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value as Source })}>
                <SelectTrigger id="edit-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Source.website}>Website</SelectItem>
                  <SelectItem value={Source.referral}>Referral</SelectItem>
                  <SelectItem value={Source.walkIn}>Walk-in</SelectItem>
                  <SelectItem value={Source.phone}>Phone</SelectItem>
                  <SelectItem value={Source.socialMedia}>Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-agent" className="text-sm font-medium">
                Assigned Agent <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.assignedAgent} 
                onValueChange={(value) => {
                  setFormData({ ...formData, assignedAgent: value });
                  setValidationErrors({ ...validationErrors, assignedAgent: '' });
                }}
              >
                <SelectTrigger id="edit-agent" className={validationErrors.assignedAgent ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(a => a.active).map((agent) => (
                    <SelectItem key={agent.id.toString()} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.assignedAgent && (
                <p className="text-sm text-destructive">{validationErrors.assignedAgent}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-sm font-medium">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Status__1 })}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status__1.new_}>New</SelectItem>
                  <SelectItem value={Status__1.inProgress}>In Progress</SelectItem>
                  <SelectItem value={Status__1.followUp}>Follow Up</SelectItem>
                  <SelectItem value={Status__1.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-sm font-medium">
                Notes <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => {
                  setFormData({ ...formData, notes: e.target.value });
                  setValidationErrors({ ...validationErrors, notes: '' });
                }}
                placeholder="Add notes about this inquiry"
                rows={4}
                className={validationErrors.notes ? 'border-destructive' : ''}
              />
              {validationErrors.notes && (
                <p className="text-sm text-destructive">{validationErrors.notes}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updateInquiry.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={updateInquiry.isPending}
            >
              {updateInquiry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
