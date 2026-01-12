import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminUser } from '@/lib/api/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, ShieldCheck, User, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type AppRole = 'super_admin' | 'doctor' | 'staff';

interface UserWithRole {
  _id: string;
  role: AppRole;
  createdAt: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  assignedDoctorId?: string | { _id: string; registrationNo?: string; specialization?: string; clinicName?: string };
}

const UserRolesManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('doctor');
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<UserWithRole | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const response = await adminApi.getAllUsers();
      if (response.success && response.data) {
        return response.data.map((user: any) => ({
          _id: user._id,
          role: user.role,
          createdAt: user.createdAt,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          assignedDoctorId: user.assignedDoctorId,
          createdBy: user.createdBy,
        }));
      }
      return [];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const response = await adminApi.updateUserRole(userId, role);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update role');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('User role updated successfully');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      console.error('Role update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await adminApi.updateUserStatus(userId, isActive);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  const assignDoctorMutation = useMutation({
    mutationFn: async ({ userId, doctorId }: { userId: string; doctorId: string }) => {
      const response = await adminApi.assignDoctorToStaff(userId, doctorId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to assign doctor');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Doctor assigned to staff successfully');
      setSelectedStaffForAssignment(null);
      setSelectedDoctorId('');
    },
    onError: (error: any) => {
      console.error('Doctor assignment error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign doctor');
    },
  });

  const unassignDoctorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.unassignDoctorFromStaff(userId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unassign doctor');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Doctor unassigned from staff successfully');
    },
    onError: (error: any) => {
      console.error('Doctor unassignment error:', error);
      toast.error(error.response?.data?.message || 'Failed to unassign doctor');
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="h-4 w-4" />;
      case 'doctor':
        return <UserCog className="h-4 w-4" />;
      case 'staff':
        return <User className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-destructive gap-1">{getRoleIcon(role)} Super Admin</Badge>;
      case 'doctor':
        return <Badge variant="default" className="gap-1">{getRoleIcon(role)} Doctor</Badge>;
      case 'staff':
        return <Badge variant="secondary" className="gap-1">{getRoleIcon(role)} Staff</Badge>;
      default:
        return <Badge variant="outline" className="gap-1">{getRoleIcon(role)} {role}</Badge>;
    }
  };

  const openRoleChange = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
  };

  const handleRoleChange = () => {
    if (!selectedUser) return;
    updateRoleMutation.mutate({
      userId: selectedUser._id,
      role: newRole,
    });
  };

  const handleStatusToggle = (user: UserWithRole) => {
    updateStatusMutation.mutate({
      userId: user._id,
      isActive: !user.isActive,
    });
  };

  const roleStats = {
    total: users?.length || 0,
    superAdmins: users?.filter(u => u.role === 'super_admin').length || 0,
    doctors: users?.filter(u => u.role === 'doctor').length || 0,
    staff: users?.filter(u => u.role === 'staff').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <ShieldCheck className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.superAdmins}</p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserCog className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.doctors}</p>
                <p className="text-sm text-muted-foreground">Doctors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <User className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roleStats.staff}</p>
                <p className="text-sm text-muted-foreground">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>User Roles Management</CardTitle>
              <CardDescription>View and modify user roles across the system</CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedStaffForAssignment({ _id: '', role: 'staff', createdAt: '', name: '', email: '', isActive: true } as UserWithRole);
                setSelectedDoctorId('');
              }}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Create Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Assigned Doctor</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="font-medium">{user.name || 'Unknown'}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">{user.phone}</div>
                          )}
                          {!user.isActive && (
                            <Badge variant="destructive" className="mt-1">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.role === 'staff' ? (
                            user.assignedDoctorId ? (
                              typeof user.assignedDoctorId === 'object' && user.assignedDoctorId ? (
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {user.assignedDoctorId.clinicName || 'Dr. ' + (user.assignedDoctorId.registrationNo || '')}
                                  </div>
                                  {user.assignedDoctorId.specialization && (
                                    <div className="text-xs text-muted-foreground">{user.assignedDoctorId.specialization}</div>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary">Assigned</Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Not Assigned</Badge>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.createdBy ? (
                            typeof user.createdBy === 'object' && user.createdBy ? (
                              <div className="text-sm">
                                <div className="font-medium">{user.createdBy.name || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground">{user.createdBy.email || ''}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.role === 'staff' && (
                              <>
                                {user.assignedDoctorId ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unassignDoctorMutation.mutate(user._id)}
                                    className="gap-1"
                                    disabled={unassignDoctorMutation.isPending}
                                  >
                                    Unassign Doctor
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedStaffForAssignment(user);
                                      setSelectedDoctorId('');
                                    }}
                                    className="gap-1"
                                  >
                                    Assign Doctor
                                  </Button>
                                )}
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusToggle(user)}
                              className="gap-1"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleChange(user)}
                              className="gap-1"
                            >
                              <Shield className="h-3 w-3" />
                              Change Role
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Doctor / Create Staff Dialog */}
      <Dialog open={!!selectedStaffForAssignment} onOpenChange={() => setSelectedStaffForAssignment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStaffForAssignment?._id ? 'Assign Doctor to Staff' : 'Create New Staff'}
            </DialogTitle>
            <DialogDescription>
              {selectedStaffForAssignment?._id
                ? `Assign a doctor to ${selectedStaffForAssignment?.name || 'this staff member'}`
                : 'Create a new staff member and assign them to a doctor'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedStaffForAssignment?._id ? (
              // Existing staff - assign doctor
              <>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{selectedStaffForAssignment?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStaffForAssignment?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assign-doctor">Select Doctor</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger id="assign-doctor">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization} ({doctor.registrationNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {doctors.length === 0 && (
                    <p className="text-xs text-muted-foreground">No doctors available</p>
                  )}
                </div>
              </>
            ) : (
              // New staff - create and assign
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-staff-name">Full Name *</Label>
                  <Input
                    id="new-staff-name"
                    value={selectedStaffForAssignment?.name || ''}
                    onChange={(e) => setSelectedStaffForAssignment({
                      ...selectedStaffForAssignment!,
                      name: e.target.value,
                    } as UserWithRole)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-staff-email">Email *</Label>
                  <Input
                    id="new-staff-email"
                    type="email"
                    value={selectedStaffForAssignment?.email || ''}
                    onChange={(e) => setSelectedStaffForAssignment({
                      ...selectedStaffForAssignment!,
                      email: e.target.value,
                    } as UserWithRole)}
                    placeholder="staff@clinic.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-staff-password">Password *</Label>
                  <Input
                    id="new-staff-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-staff-phone">Phone (Optional)</Label>
                  <Input
                    id="new-staff-phone"
                    type="tel"
                    value={selectedStaffForAssignment?.phone || ''}
                    onChange={(e) => setSelectedStaffForAssignment({
                      ...selectedStaffForAssignment!,
                      phone: e.target.value,
                    } as UserWithRole)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-staff-doctor">Assign to Doctor *</Label>
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger id="new-staff-doctor">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization} ({doctor.registrationNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {doctors.length === 0 && (
                    <p className="text-xs text-muted-foreground">No doctors available</p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStaffForAssignment(null)}>
              Cancel
            </Button>
            {selectedStaffForAssignment?._id ? (
              <Button
                onClick={() => {
                  if (selectedStaffForAssignment && selectedDoctorId) {
                    assignDoctorMutation.mutate({
                      userId: selectedStaffForAssignment._id,
                      doctorId: selectedDoctorId,
                    });
                  }
                }}
                disabled={assignDoctorMutation.isPending || !selectedDoctorId}
              >
                {assignDoctorMutation.isPending ? 'Assigning...' : 'Assign Doctor'}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const passwordInput = document.getElementById('new-staff-password') as HTMLInputElement;
                  if (!selectedStaffForAssignment?.name || !selectedStaffForAssignment?.email || !passwordInput?.value || !selectedDoctorId) {
                    toast.error('Please fill in all required fields');
                    return;
                  }
                  adminApi.createStaff({
                    name: selectedStaffForAssignment.name,
                    email: selectedStaffForAssignment.email,
                    password: passwordInput.value,
                    phone: selectedStaffForAssignment.phone,
                    doctorId: selectedDoctorId,
                  }).then((response) => {
                    if (response.success) {
                      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
                      toast.success('Staff member created successfully');
                      setSelectedStaffForAssignment(null);
                      setSelectedDoctorId('');
                    }
                  }).catch((error: any) => {
                    toast.error(error.response?.data?.message || 'Failed to create staff');
                  });
                }}
              >
                Create Staff
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div>{selectedUser && getRoleBadge(selectedUser.role)}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Staff
                    </div>
                  </SelectItem>
                  <SelectItem value="doctor">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Doctor
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Super Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newRole === 'super_admin' && 'Super Admins have full access to all features and can manage other users.'}
                {newRole === 'doctor' && 'Doctors can manage patients, create prescriptions, and access their own data.'}
                {newRole === 'staff' && 'Staff have limited access to assist with day-to-day operations.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRoleChange} 
              disabled={updateRoleMutation.isPending || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRolesManagement;
