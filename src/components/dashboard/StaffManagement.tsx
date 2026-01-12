import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi, StaffMember } from '@/lib/api/doctor.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, UserPlus, Loader2, X, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function StaffManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['doctor-staff'],
    queryFn: async () => {
      const response = await doctorApi.getMyStaff();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; phone?: string }) => {
      const response = await doctorApi.createStaff(data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create staff');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-staff'] });
      toast.success('Staff member created successfully');
      setIsAddDialogOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
    },
    onError: (error: any) => {
      console.error('Staff creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create staff member');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
      const response = await doctorApi.updateStaffStatus(staffId, isActive);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-staff'] });
      toast.success('Staff status updated successfully');
    },
    onError: (error: any) => {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update staff status');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    createStaffMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
    });
  };

  const handleStatusToggle = (staff: StaffMember) => {
    updateStatusMutation.mutate({
      staffId: staff._id,
      isActive: !staff.isActive,
    });
  };

  const activeStaff = staff?.filter(s => s.isActive).length || 0;
  const totalStaff = staff?.length || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5 text-primary" />
                Staff Management
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">Manage your clinic staff members</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 w-full sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{totalStaff}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Staff</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{activeStaff}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Staff</p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Table - Desktop */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : staff && staff.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>
                          {member.isActive ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(member.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusToggle(member)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {staff.map((member) => (
                  <Card key={member._id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base">{member.name}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{member.email}</p>
                          </div>
                          {member.isActive ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p className="font-medium">{member.phone || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-medium">{format(new Date(member.createdAt), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleStatusToggle(member)}
                          disabled={updateStatusMutation.isPending}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">No staff members yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Your First Staff Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New Staff Member</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new staff member. They will be automatically assigned to you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> This staff member will be automatically assigned to you. 
                They can add patients which will appear in your dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-name" className="text-sm">Full Name *</Label>
              <Input
                id="staff-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email" className="text-sm">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@clinic.com"
                required
                className="h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password" className="text-sm">Password *</Label>
              <Input
                id="staff-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone" className="text-sm">Phone (Optional)</Label>
              <Input
                id="staff-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-10 sm:h-11"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStaffMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createStaffMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Staff'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

