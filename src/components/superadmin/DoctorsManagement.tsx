import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminDoctor } from '@/lib/api/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Trash2, UserPlus, Save, X, Mail, Phone, Building, Stethoscope, Users, CheckCircle2, XCircle, Loader2, Award, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  registrationNo: string;
  qualification: string;
  specialization: string;
  clinicName?: string;
  clinicAddress?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const DoctorsManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    qualification: '',
    specialization: '',
    clinic_name: '',
    clinic_address: '',
    registration_no: '',
  });
  const queryClient = useQueryClient();

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const response = await adminApi.getAllDoctors();
      if (response.success && response.data) {
        return response.data.map((d) => ({
          id: d.id,
          userId: d.userId,
          name: d.name,
          email: d.email,
          phone: d.phone,
          registrationNo: d.registrationNo,
          qualification: d.qualification,
          specialization: d.specialization,
          clinicName: d.clinicName,
          clinicAddress: d.clinicAddress,
          role: d.role,
          isActive: d.isActive,
          modality: d.modality || 'electro_homeopathy',
          preferredModality: d.preferredModality,
          createdAt: d.createdAt,
        }));
      }
      return [];
    },
  });

  const updateDoctorMutation = useMutation({
    mutationFn: async (data: { doctorId: string; userId: string; form: typeof editForm }) => {
      const response = await adminApi.updateDoctor(data.doctorId, {
        qualification: data.form.qualification,
        specialization: data.form.specialization,
        clinicName: data.form.clinic_name || undefined,
        clinicAddress: data.form.clinic_address || undefined,
        name: data.form.name,
        phone: data.form.phone || undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update doctor');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor'] });
      toast.success('Doctor updated successfully');
      setEditingDoctor(null);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update doctor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      // Note: In a real scenario, you might want to deactivate the user instead of deleting
      // For now, we'll just show a message that deletion should be done carefully
      throw new Error('Doctor deletion should be handled through user deactivation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete doctor');
    },
  });

  const filteredDoctors = doctors?.filter(
    (doctor) =>
      doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.registrationNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.clinicName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      name: doctor.name || '',
      phone: doctor.phone || '',
      qualification: doctor.qualification,
      specialization: doctor.specialization,
      clinic_name: doctor.clinicName || '',
      clinic_address: doctor.clinicAddress || '',
      registration_no: doctor.registrationNo,
    });
  };

  const handleSaveEdit = () => {
    if (!editingDoctor) return;
    updateDoctorMutation.mutate({
      doctorId: editingDoctor.id,
      userId: editingDoctor.userId,
      form: editForm,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-destructive">Super Admin</Badge>;
      case 'doctor':
        return <Badge variant="default">Doctor</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Calculate stats
  const stats = {
    total: doctors?.length || 0,
    active: doctors?.filter(d => d.isActive).length || 0,
    inactive: doctors?.filter(d => !d.isActive).length || 0,
    withClinic: doctors?.filter(d => d.clinicName).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            Doctors Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all registered doctors in the system
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button 
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Doctor
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Doctors can self-register by signing up. Use this form for manual additions.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Doctors register themselves through the signup page.</p>
              <p className="text-sm mt-2">
                Share the registration link with new doctors to onboard them.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Doctors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered doctors</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              Inactive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">Deactivated accounts</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              With Clinic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.withClinic}</div>
            <p className="text-xs text-muted-foreground mt-1">Clinic registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, registration number, or clinic name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>All Doctors ({filteredDoctors?.length || 0})</CardTitle>
          <CardDescription>
            View and manage all registered doctors
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, registration, or clinic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDoctors?.length === 0 ? (
            <div className="py-12 text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No doctors found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search query
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Doctor</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Registration</TableHead>
                    <TableHead className="font-semibold">Specialization</TableHead>
                    <TableHead className="font-semibold">Modality</TableHead>
                    <TableHead className="font-semibold">Clinic</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Joined</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors?.map((doctor) => (
                    <TableRow 
                      key={doctor.id}
                      className="hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{doctor.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Award className="h-3 w-3" />
                              {doctor.qualification}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                              <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="truncate max-w-[150px] text-foreground">{doctor.email || 'N/A'}</span>
                          </div>
                          {doctor.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                                <Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span>{doctor.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs border-primary/20">
                          {doctor.registrationNo || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                          {doctor.specialization}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doctor.clinicName ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/10">
                              <Building className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground truncate max-w-[120px] block">
                                {doctor.clinicName}
                              </span>
                              {doctor.clinicAddress && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]">{doctor.clinicAddress}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getRoleBadge(doctor.role || 'doctor')}
                          {!doctor.isActive && (
                            <Badge variant="destructive" className="w-fit text-xs">
                              Inactive
                            </Badge>
                          )}
                          {doctor.isActive && (
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 w-fit text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(doctor.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(doctor)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm('Are you sure you want to deactivate this doctor? Deactivation is recommended over deletion.')) {
                                adminApi.updateUserStatus(doctor.userId, false).then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
                                  toast.success('Doctor deactivated successfully');
                                }).catch((error) => {
                                  toast.error(error.response?.data?.message || 'Failed to deactivate doctor');
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Enhanced Edit Dialog */}
      <Dialog open={!!editingDoctor} onOpenChange={() => setEditingDoctor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Edit className="h-4 w-4 text-white" />
              </div>
              Edit Doctor
            </DialogTitle>
            <DialogDescription>
              Update doctor information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registration_no" className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Registration No.
                </Label>
                <Input
                  id="registration_no"
                  value={editForm.registration_no}
                  onChange={(e) => setEditForm({ ...editForm, registration_no: e.target.value })}
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification" className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Specialization
              </Label>
              <Input
                id="specialization"
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic_name" className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                Clinic Name
              </Label>
              <Input
                id="clinic_name"
                value={editForm.clinic_name}
                onChange={(e) => setEditForm({ ...editForm, clinic_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic_address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Clinic Address
              </Label>
              <Input
                id="clinic_address"
                value={editForm.clinic_address}
                onChange={(e) => setEditForm({ ...editForm, clinic_address: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoctor(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={updateDoctorMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {updateDoctorMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorsManagement;
