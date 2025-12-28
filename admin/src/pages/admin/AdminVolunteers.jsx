import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
} from '@/components/ui/dialog';
// ✅ AlertDialog Imports Added
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminVolunteers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events } = useQuery({
    queryKey: ['events-list'],
    queryFn: () => apiClient.getEvents(),
  });

  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['admin-volunteers'],
    queryFn: () => apiClient.getVolunteers(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createVolunteer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] });
      closeDialog();
      toast({ title: 'Volunteer created successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateVolunteer(data._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] });
      closeDialog();
      toast({ title: 'Volunteer updated successfully' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteVolunteer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-volunteers'] });
      toast({ title: 'Volunteer deleted successfully' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const volunteerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      assignedEventId: formData.get('assignedEventId') || null,
      isActive: formData.get('isActive') === 'on',
      ...(formData.get('password') && { password: formData.get('password') }),
    };

    if (editingVolunteer) {
      updateMutation.mutate({ ...volunteerData, _id: editingVolunteer._id });
    } else {
      createMutation.mutate(volunteerData);
    }
  };

  const openCreateDialog = () => {
    setEditingVolunteer(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (volunteer) => {
    setEditingVolunteer(volunteer);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingVolunteer(null);
    setShowPassword(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Volunteers</h2>
            <p className="text-muted-foreground">Manage volunteer accounts and assignments</p>
          </div>
          
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Volunteer
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingVolunteer ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
                <DialogDescription>
                  {editingVolunteer 
                    ? "Update volunteer details. Leave password blank to keep current one." 
                    : "Create a new volunteer account with login credentials."}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" defaultValue={editingVolunteer?.name} required placeholder="Jane Doe" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Username)</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    defaultValue={editingVolunteer?.email} 
                    required 
                    placeholder="jane@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {editingVolunteer ? "New Password (Optional)" : "Password"}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder={editingVolunteer ? "••••••••" : "Enter password"}
                      required={!editingVolunteer} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" defaultValue={editingVolunteer?.phone} placeholder="+91 9876543210" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedEventId">Assigned Event</Label>
                  <Select name="assignedEventId" defaultValue={editingVolunteer?.assignedEventId?._id || editingVolunteer?.assignedEventId || "unassigned"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No assignment</SelectItem>
                      {events?.map((event) => (
                        <SelectItem key={event._id} value={event._id}>{event.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    defaultChecked={editingVolunteer ? editingVolunteer.isActive : true}
                  />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingVolunteer ? 'Update' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteers?.map((volunteer) => (
                    <TableRow key={volunteer._id}>
                      <TableCell className="font-medium">{volunteer.name}</TableCell>
                      <TableCell>{volunteer.email}</TableCell>
                      <TableCell>
                        {volunteer.assignedEventId?.title 
                          ? volunteer.assignedEventId.title 
                          : <span className="text-muted-foreground italic">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={volunteer.isActive ? 'default' : 'secondary'} className={volunteer.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {volunteer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(volunteer)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        
                        {/* ✅ AlertDialog Implementation */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Volunteer?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{volunteer.name}</strong>?
                                <br />
                                This account will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(volunteer._id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </TableCell>
                    </TableRow>
                  ))}
                  {volunteers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                        No volunteers found. Click "Add Volunteer" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}