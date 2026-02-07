import { useState } from 'react';
import { useGetAllAgents, useAddAgent, useUpdateAgent, useDeactivateAgent, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, UserX, Loader2, ShieldAlert } from 'lucide-react';
import { Role, type Profile } from '../backend';
import { Principal } from '@dfinity/principal';
import AgentForm from '../components/AgentForm';

export default function AgentsPage() {
  const { data: agents = [], isLoading } = useGetAllAgents();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const deactivateAgent = useDeactivateAgent();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Profile | null>(null);

  const handleDeactivate = async (agentId: Principal) => {
    if (confirm('Are you sure you want to deactivate this agent?')) {
      await deactivateAgent.mutateAsync(agentId);
    }
  };

  const openEditDialog = (agent: Profile) => {
    setSelectedAgent(agent);
    setShowEditDialog(true);
  };

  const getRoleBadge = (role: Role) => {
    const variants: Record<Role, 'default' | 'secondary' | 'outline'> = {
      [Role.admin]: 'default',
      [Role.agent]: 'secondary',
      [Role.juniorAgent]: 'outline',
      [Role.assistant]: 'outline',
    };
    const labels: Record<Role, string> = {
      [Role.admin]: 'Admin',
      [Role.agent]: 'Agent',
      [Role.juniorAgent]: 'Junior Agent',
      [Role.assistant]: 'Assistant',
    };
    return <Badge variant={variants[role]}>{labels[role]}</Badge>;
  };

  if (isAdminLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You do not have permission to access agent management. Only administrators can manage agents.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage your real estate agents and sub-users</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No agents found. Add your first agent to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id.toString()}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.contactInfo}</TableCell>
                      <TableCell>{getRoleBadge(agent.role)}</TableCell>
                      <TableCell>
                        <Badge variant={agent.active ? 'default' : 'secondary'}>{agent.active ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(agent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {agent.active && (
                            <Button variant="outline" size="sm" onClick={() => handleDeactivate(agent.id)}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AgentForm
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        mode="add"
      />

      <AgentForm
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        mode="edit"
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}
