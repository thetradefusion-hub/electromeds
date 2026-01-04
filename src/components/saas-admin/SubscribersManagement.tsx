import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Search, Users, CreditCard, Ban, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Subscription } from '@/hooks/useSaasAdmin';

interface SubscribersManagementProps {
  subscriptions: Subscription[];
  isLoading: boolean;
}

export default function SubscribersManagement({ subscriptions, isLoading }: SubscribersManagementProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.doctor?.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.doctor?.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      sub.doctor?.clinic_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.plan?.name === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const uniquePlans = [...new Set(subscriptions.map(s => s.plan?.name).filter(Boolean))];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      trial: { variant: 'secondary', label: 'Trial' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      expired: { variant: 'outline', label: 'Expired' },
      pending: { variant: 'outline', label: 'Pending' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Subscribed Doctors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or clinic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {uniquePlans.map(plan => (
                <SelectItem key={plan} value={plan!}>{plan}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{subscriptions.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'trial').length}</p>
            <p className="text-sm text-muted-foreground">Trial</p>
          </div>
          <div className="bg-destructive/10 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{subscriptions.filter(s => s.status === 'cancelled').length}</p>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{subscriptions.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Clinic</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.doctor?.profile?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{sub.doctor?.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sub.doctor?.clinic_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.plan?.name}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                    <TableCell>
                      {format(new Date(sub.current_period_end), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        {sub.status === 'active' ? (
                          <Button size="sm" variant="outline" className="text-destructive">
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-success">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
