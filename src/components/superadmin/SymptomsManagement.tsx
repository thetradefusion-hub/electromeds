import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Symptom {
  _id: string;
  name: string;
  category: string;
  description?: string;
  isGlobal: boolean;
  createdAt: string;
}

const SYMPTOM_CATEGORIES = [
  'General',
  'Respiratory',
  'Digestive',
  'Cardiovascular',
  'Neurological',
  'Musculoskeletal',
  'Dermatological',
  'Urological',
  'Gynecological',
  'Psychological',
  'Other',
];

const SymptomsManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<Symptom | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });
  const queryClient = useQueryClient();

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ['admin-symptoms'],
    queryFn: async () => {
      const response = await adminApi.getGlobalSymptoms();
      if (response.success && response.data) {
        return response.data.map((s) => ({
          _id: s._id,
          name: s.name,
          category: s.category,
          description: s.description,
          isGlobal: s.isGlobal,
          createdAt: s.createdAt,
        }));
      }
      return [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await adminApi.createGlobalSymptom({
        name: data.name,
        category: data.category,
        description: data.description || undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to create symptom');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast.success('Symptom added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add symptom');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await adminApi.updateGlobalSymptom(id, {
        name: data.name,
        category: data.category,
        description: data.description || undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update symptom');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast.success('Symptom updated successfully');
      setEditingSymptom(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update symptom');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.deleteGlobalSymptom(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete symptom');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast.success('Symptom deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete symptom');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', category: '', description: '' });
  };

  const handleEdit = (symptom: Symptom) => {
    setEditingSymptom(symptom);
    setFormData({
      name: symptom.name,
      category: symptom.category,
      description: symptom.description || '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingSymptom) {
      updateMutation.mutate({ id: editingSymptom._id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const filteredSymptoms = symptoms?.filter(
    (symptom) =>
      symptom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      symptom.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedSymptoms = filteredSymptoms?.reduce((acc, symptom) => {
    if (!acc[symptom.category]) {
      acc[symptom.category] = [];
    }
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<string, Symptom[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Global Symptoms</CardTitle>
            <CardDescription>Manage global symptom library available to all doctors</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen || !!editingSymptom} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingSymptom(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Symptom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSymptom ? 'Edit Symptom' : 'Add New Symptom'}</DialogTitle>
                <DialogDescription>
                  {editingSymptom ? 'Update the symptom details' : 'Add a new symptom to the global library'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Headache"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYMPTOM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingSymptom(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingSymptom ? 'Update' : 'Add'} Symptom
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search symptoms..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSymptoms?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No symptoms found. Add your first global symptom.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSymptoms?.map((symptom) => (
                    <TableRow key={symptom._id}>
                      <TableCell className="font-medium">{symptom.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{symptom.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {symptom.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(symptom)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(symptom._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
};

export default SymptomsManagement;
