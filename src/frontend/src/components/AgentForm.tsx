import { useState, useEffect } from 'react';
import { useAddAgent, useUpdateAgent } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Loader2 } from 'lucide-react';
import { Role, type Profile } from '../backend';
import { Principal } from '@dfinity/principal';

interface AgentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  agent?: Profile | null;
  onClose?: () => void;
}

interface FormData {
  principalId: string;
  name: string;
  contactInfo: string;
  role: Role;
  active: boolean;
}

interface FormErrors {
  principalId?: string;
  name?: string;
  contactInfo?: string;
  role?: string;
}

export default function AgentForm({ open, onOpenChange, mode, agent, onClose }: AgentFormProps) {
  const addAgent = useAddAgent();
  const updateAgent = useUpdateAgent();

  const [formData, setFormData] = useState<FormData>({
    principalId: '',
    name: '',
    contactInfo: '',
    role: Role.agent,
    active: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (mode === 'edit' && agent) {
      setFormData({
        principalId: agent.id.toString(),
        name: agent.name,
        contactInfo: agent.contactInfo,
        role: agent.role,
        active: agent.active,
      });
      setErrors({});
      setTouched({});
    } else if (mode === 'add') {
      setFormData({
        principalId: '',
        name: '',
        contactInfo: '',
        role: Role.agent,
        active: true,
      });
      setErrors({});
      setTouched({});
    }
  }, [mode, agent, open]);

  const validateField = (name: keyof FormData, value: string | boolean): string | undefined => {
    switch (name) {
      case 'principalId':
        if (mode === 'add') {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            return 'Principal ID is required';
          }
          try {
            Principal.fromText(value as string);
          } catch {
            return 'Invalid Principal ID format';
          }
        }
        break;
      case 'name':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Name is required';
        }
        if (typeof value === 'string' && value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        break;
      case 'contactInfo':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Contact information is required';
        }
        if (typeof value === 'string' && value.trim().length < 5) {
          return 'Contact information must be at least 5 characters';
        }
        break;
    }
    return undefined;
  };

  const handleFieldChange = (name: keyof FormData, value: string | boolean | Role) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value as string | boolean);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name] as string | boolean);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (mode === 'add') {
      const principalError = validateField('principalId', formData.principalId);
      if (principalError) newErrors.principalId = principalError;
    }
    
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;
    
    const contactError = validateField('contactInfo', formData.contactInfo);
    if (contactError) newErrors.contactInfo = contactError;

    setErrors(newErrors);
    setTouched({
      principalId: true,
      name: true,
      contactInfo: true,
      role: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'add') {
        const agentPrincipal = Principal.fromText(formData.principalId);
        await addAgent.mutateAsync({
          agentPrincipal,
          name: formData.name.trim(),
          contactInfo: formData.contactInfo.trim(),
          role: formData.role,
        });
      } else if (mode === 'edit' && agent) {
        await updateAgent.mutateAsync({
          agentId: agent.id,
          name: formData.name.trim(),
          contactInfo: formData.contactInfo.trim(),
          role: formData.role,
        });
      }
      
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      principalId: '',
      name: '',
      contactInfo: '',
      role: Role.agent,
      active: true,
    });
    setErrors({});
    setTouched({});
    onOpenChange(false);
    if (onClose) onClose();
  };

  const isSubmitting = addAgent.isPending || updateAgent.isPending;
  const isFormValid = mode === 'add' 
    ? formData.principalId.trim() !== '' && formData.name.trim() !== '' && formData.contactInfo.trim() !== ''
    : formData.name.trim() !== '' && formData.contactInfo.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Agent' : 'Edit Agent'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Enter the details of the new agent including their Internet Identity Principal ID' 
              : 'Update agent information and role'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {mode === 'add' && (
            <div className="space-y-2">
              <Label htmlFor="principalId" className="text-sm font-medium">
                Principal ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="principalId"
                value={formData.principalId}
                onChange={(e) => handleFieldChange('principalId', e.target.value)}
                onBlur={() => handleBlur('principalId')}
                placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                className={errors.principalId && touched.principalId ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.principalId && touched.principalId && (
                <p className="text-sm text-destructive">{errors.principalId}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The agent's Internet Identity Principal ID (they can find this after logging in)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Enter agent name"
              className={errors.name && touched.name ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.name && touched.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactInfo" className="text-sm font-medium">
              Contact Information <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactInfo"
              value={formData.contactInfo}
              onChange={(e) => handleFieldChange('contactInfo', e.target.value)}
              onBlur={() => handleBlur('contactInfo')}
              placeholder="Email or phone number"
              className={errors.contactInfo && touched.contactInfo ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.contactInfo && touched.contactInfo && (
              <p className="text-sm text-destructive">{errors.contactInfo}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleFieldChange('role', value as Role)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.admin}>Admin</SelectItem>
                <SelectItem value={Role.agent}>Agent</SelectItem>
                <SelectItem value={Role.juniorAgent}>Junior Agent</SelectItem>
                <SelectItem value={Role.assistant}>Assistant</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the appropriate role for this agent
            </p>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.active ? 'Agent is currently active' : 'Agent is currently inactive'}
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleFieldChange('active', checked)}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isSubmitting || Object.keys(errors).length > 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'add' ? 'Add Agent' : 'Update Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
