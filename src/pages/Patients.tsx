import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePatients, Patient } from '@/hooks/usePatients';
import { exportPatientsToCSV } from '@/utils/exportUtils';
import { PatientSearchFilters, PatientFilters, defaultFilters } from '@/components/patients/PatientSearchFilters';
import { Plus, User, Phone, MapPin, Calendar, MoreVertical, FileText, Stethoscope, Trash2, Edit, Loader2, Download, History, Search, Users, UserPlus, TrendingUp } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Patients() {
  const { patients, loading, deletePatient, updatePatient } = usePatients();
  const [filters, setFilters] = useState<PatientFilters>(defaultFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({ name: '', age: '', mobile: '', address: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Text search
      const searchLower = filters.searchQuery.toLowerCase();
      const matchesSearch =
        !filters.searchQuery ||
        patient.name.toLowerCase().includes(searchLower) ||
        patient.patient_id.toLowerCase().includes(searchLower) ||
        patient.mobile.includes(filters.searchQuery) ||
        (patient.address?.toLowerCase().includes(searchLower) ?? false);

      // Case type filter
      const matchesCaseType =
        filters.caseType === 'all' || patient.case_type === filters.caseType;

      // Gender filter
      const matchesGender =
        filters.gender === 'all' || patient.gender.toLowerCase() === filters.gender;

      // Age range filter
      const matchesAge =
        (filters.ageRange.min === null || patient.age >= filters.ageRange.min) &&
        (filters.ageRange.max === null || patient.age <= filters.ageRange.max);

      // Date range filter
      const visitDate = new Date(patient.visit_date);
      const matchesDateFrom =
        !filters.dateRange.from ||
        isAfter(visitDate, startOfDay(filters.dateRange.from)) ||
        visitDate.toDateString() === filters.dateRange.from.toDateString();
      const matchesDateTo =
        !filters.dateRange.to ||
        isBefore(visitDate, endOfDay(filters.dateRange.to)) ||
        visitDate.toDateString() === filters.dateRange.to.toDateString();

      return (
        matchesSearch &&
        matchesCaseType &&
        matchesGender &&
        matchesAge &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [patients, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const newCases = patients.filter(p => p.case_type === 'new').length;
    const followUps = patients.filter(p => p.case_type === 'old').length;
    const malePatients = patients.filter(p => p.gender.toLowerCase() === 'male').length;
    const femalePatients = patients.filter(p => p.gender.toLowerCase() === 'female').length;
    
    return {
      total: patients.length,
      newCases,
      followUps,
      male: malePatients,
      female: femalePatients,
    };
  }, [patients]);

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePatient(deleteId);
      setDeleteId(null);
    }
  };

  const openEdit = (patient: Patient) => {
    setEditPatient(patient);
    setEditForm({
      name: patient.name,
      age: patient.age.toString(),
      mobile: patient.mobile,
      address: patient.address || '',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPatient) {
      await updatePatient(editPatient.id, {
        name: editForm.name,
        age: parseInt(editForm.age, 10),
        mobile: editForm.mobile,
        address: editForm.address || undefined,
      });
      setEditPatient(null);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Patients" subtitle="Manage your patient records">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Patients" subtitle="Manage your patient records">
      <div className="space-y-4 sm:space-y-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-4 sm:p-6 shadow-sm">
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Patient Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage and track all your patient records
              </p>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background border border-blue-500/20 p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl" />
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background border border-blue-500/20 p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md group-hover:scale-110 transition-transform">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{stats.newCases}</p>
              <p className="text-xs text-muted-foreground">New Cases</p>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl" />
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background border border-blue-500/20 p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{stats.followUps}</p>
              <p className="text-xs text-muted-foreground">Follow-ups</p>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl" />
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-background border border-cyan-500/20 p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{stats.male}</p>
              <p className="text-xs text-muted-foreground">Male</p>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl" />
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-background border border-pink-500/20 p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 shadow-md group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-0.5">{stats.female}</p>
              <p className="text-xs text-muted-foreground">Female</p>
            </div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <input
              type="text"
              placeholder="Search patients..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full h-11 rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Desktop Search & Filters */}
        <div className="hidden sm:block space-y-4">
          <PatientSearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>
          
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredPatients.length}</span> of <span className="font-semibold text-foreground">{patients.length}</span> patients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportPatientsToCSV(filteredPatients);
                toast.success('Patients exported to CSV');
              }}
              disabled={filteredPatients.length === 0}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:from-secondary/90 hover:to-secondary/70 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <Link 
              to="/patients/new" 
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Patient</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient, index) => (
            <div
              key={patient.id}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/2 group-hover:to-transparent transition-all duration-300" />
              
              <div className="relative p-4 sm:p-5">
                <div className="mb-3 sm:mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 shadow-sm">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate mb-0.5">{patient.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono">{patient.patient_id}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="touch-target flex items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground p-1.5">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEdit(patient)} className="rounded-lg">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(patient.id)}
                        className="text-destructive rounded-lg"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-3 sm:mb-4 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-semibold text-foreground">{patient.age}y</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="capitalize text-muted-foreground">{patient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/60" />
                    <span className="font-mono">{patient.mobile}</span>
                  </div>
                  {patient.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-primary/60" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/60" />
                    <span>Last visit: <span className="font-medium text-foreground">{format(new Date(patient.visit_date), 'dd MMM yyyy')}</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-3 sm:pt-4">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium shadow-sm',
                      patient.case_type === 'new'
                        ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20'
                    )}
                  >
                    {patient.case_type === 'new' ? 'New Case' : 'Follow-up'}
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link
                      to={`/patients/history?patient=${patient.id}`}
                      className="touch-target flex items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground p-1.5"
                      title="View History"
                    >
                      <History className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/prescriptions?patient=${patient.id}`}
                      className="touch-target flex items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground p-1.5"
                      title="View Prescriptions"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/consultation?patient=${patient.id}`}
                      className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-md"
                    >
                      <Stethoscope className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Consult
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <User className="h-10 w-10 text-primary/60" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full blur-md" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">No patients found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {filters.searchQuery
                ? 'Try adjusting your search filters to find what you\'re looking for'
                : 'Start by adding your first patient to begin managing records'}
            </p>
            {!filters.searchQuery && (
              <Link 
                to="/patients/new" 
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add Your First Patient
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPatient} onOpenChange={() => setEditPatient(null)}>
        <DialogContent className="rounded-2xl mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="medical-input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Age</label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  className="medical-input"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mobile</label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="medical-input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Address</label>
              <textarea
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="medical-input resize-none"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditPatient(null)} className="medical-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="medical-btn-primary">
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
