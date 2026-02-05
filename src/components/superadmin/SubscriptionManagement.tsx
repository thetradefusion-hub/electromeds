import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, AdminSubscription } from '@/lib/api/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Search, 
  Users, 
  TrendingUp, 
  Calendar,
  Crown,
  Loader2,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SubscriptionManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const response = await adminApi.getAllSubscriptions();
      if (!response.success) return [];
      return response.data || [];
    },
  });

  // Filter subscriptions
  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesSearch = 
      sub.doctorId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.doctorId?.clinicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.planId?.name === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  }) || [];

  // Calculate stats
  const stats = {
    total: subscriptions?.length || 0,
    active: subscriptions?.filter(s => s.status === 'active').length || 0,
    trial: subscriptions?.filter(s => s.status === 'trial').length || 0,
    cancelled: subscriptions?.filter(s => s.status === 'cancelled').length || 0,
    monthlyRevenue: subscriptions
      ?.filter(s => s.status === 'active' && s.billingCycle === 'monthly')
      .reduce((sum, s) => sum + (s.planId?.priceMonthly || 0), 0) || 0,
    yearlyRevenue: subscriptions
      ?.filter(s => s.status === 'active' && s.billingCycle === 'yearly')
      .reduce((sum, s) => sum + (s.planId?.priceYearly || 0), 0) || 0,
  };

  const totalRevenue = stats.monthlyRevenue + stats.yearlyRevenue;

  // Get unique plan names for filter
  const planNames = Array.from(new Set(subscriptions?.map(s => s.planId?.name).filter(Boolean) || []));

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      active: { variant: 'default', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
      trial: { variant: 'secondary', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
      cancelled: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
      expired: { variant: 'outline', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
      pending: { variant: 'outline', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={cn('border', config.className)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Subscription Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all doctor subscriptions and plans
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.trial}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{stats.monthlyRevenue.toLocaleString()}/mo + ₹{stats.yearlyRevenue.toLocaleString()}/yr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </label>
              <Input
                placeholder="Search by doctor name, clinic, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Plan
              </label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {planNames.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>
            View and manage all doctor subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">
                            {sub.doctorId?.name || 'N/A'}
                          </div>
                          {sub.doctorId?.clinicName && (
                            <div className="text-xs text-muted-foreground">
                              {sub.doctorId.clinicName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          <span className="font-medium">{sub.planId?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sub.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {sub.billingCycle}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₹{sub.billingCycle === 'monthly' 
                            ? sub.planId?.priceMonthly?.toLocaleString() 
                            : sub.planId?.priceYearly?.toLocaleString() || sub.planId?.priceMonthly?.toLocaleString()}
                          <span className="text-xs text-muted-foreground ml-1">
                            /{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(sub.currentPeriodStart), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Until {format(new Date(sub.currentPeriodEnd), 'MMM dd, yyyy')}
                          </div>
                          {sub.trialEndsAt && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Trial until {format(new Date(sub.trialEndsAt), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(sub.createdAt), 'MMM dd, yyyy')}
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
    </div>
  );
};

export default SubscriptionManagement;

