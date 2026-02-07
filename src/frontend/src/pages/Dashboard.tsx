import { useGetAllAgents, useGetAllProperties, useGetAllInquiries } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Home, FileText, TrendingUp, Building2, CheckCircle2 } from 'lucide-react';
import { Category, Status, Status__1 } from '../backend';
import { Skeleton } from '../components/ui/skeleton';
import AdminResetControl from '../components/AdminResetControl';

export default function Dashboard() {
  const { data: agents = [], isLoading: agentsLoading } = useGetAllAgents();
  const { data: properties = [], isLoading: propertiesLoading } = useGetAllProperties();
  const { data: inquiries = [], isLoading: inquiriesLoading } = useGetAllInquiries();

  const activeAgents = agents.filter((a) => a.active).length;
  const totalProperties = properties.length;
  const availableProperties = properties.filter((p) => p.status === Status.available).length;
  const newInquiries = inquiries.filter((i) => i.status === Status__1.new_).length;

  const resaleCount = properties.filter((p) => p.category === Category.resale).length;
  const rentalCount = properties.filter((p) => p.category === Category.rental).length;
  const underConstructionCount = properties.filter((p) => p.category === Category.underConstruction).length;

  const isLoading = agentsLoading || propertiesLoading || inquiriesLoading;

  const stats = [
    { title: 'Active Agents', value: activeAgents, icon: Users, color: 'text-blue-600' },
    { title: 'Total Properties', value: totalProperties, icon: Home, color: 'text-green-600' },
    { title: 'Available Properties', value: availableProperties, icon: Building2, color: 'text-purple-600' },
    { title: 'New Inquiries', value: newInquiries, icon: FileText, color: 'text-orange-600' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          <strong>Mulund Real Estate Agents' Association (MAA)</strong>
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Property Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Resale Properties</span>
                  <span className="text-2xl font-bold text-blue-600">{resaleCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rental Properties</span>
                  <span className="text-2xl font-bold text-green-600">{rentalCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Under Construction</span>
                  <span className="text-2xl font-bold text-purple-600">{underConstructionCount}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Agents</span>
                  <span className="font-semibold">{agents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Inquiries</span>
                  <span className="font-semibold">{inquiries.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Closed Inquiries</span>
                  <span className="font-semibold">{inquiries.filter((i) => i.status === Status__1.closed).length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <img 
          src="/assets/generated/dashboard-hero.dim_1200x400.jpg" 
          alt="Mulund Skyline" 
          className="w-full rounded-lg object-cover shadow-lg"
        />
      </div>

      <div className="mt-8">
        <AdminResetControl />
      </div>
    </div>
  );
}
