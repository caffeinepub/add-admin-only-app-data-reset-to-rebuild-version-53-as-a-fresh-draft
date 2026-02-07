import { useState } from 'react';
import { useIsCallerAdmin, useResetToFreshDraft } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function AdminResetControl() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const resetMutation = useResetToFreshDraft();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Only render for admins
  if (isAdminLoading || !isAdmin) {
    return null;
  }

  const isConfirmationValid = confirmationText === 'RESET';
  const isResetting = resetMutation.isPending;

  const handleReset = async () => {
    if (!isConfirmationValid) return;

    try {
      await resetMutation.mutateAsync();
      setIsDialogOpen(false);
      setConfirmationText('');
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error('Reset failed:', error);
    }
  };

  const handleDialogClose = () => {
    if (!isResetting) {
      setIsDialogOpen(false);
      setConfirmationText('');
    }
  };

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
      <div className="mb-4 flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <div>
          <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This action will permanently delete all application data including agents, properties, inquiries, and user profiles.
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={isResetting}>
            Reset App Data
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Reset to Fresh Draft
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will delete:
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>All agents and their profiles</li>
                <li>All properties and images</li>
                <li>All inquiries and customer data</li>
                <li>All user profiles</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type <span className="font-mono font-bold">RESET</span> to confirm
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type RESET here"
              disabled={isResetting}
              className="font-mono"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              disabled={!isConfirmationValid || isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Application Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
