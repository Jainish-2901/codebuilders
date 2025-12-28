import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminExternalEvents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-external-events'],
    queryFn: async () => {
      return await apiClient.getExternalEvents();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createExternalEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-external-events']);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "External event created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create external event",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateExternalEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-external-events']);
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast({
        title: "Success",
        description: "External event updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update external event",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteExternalEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-external-events']);
      toast({
        title: "Success",
        description: "External event deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete external event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      link: formData.get('link'),
      date: formData.get('date'),
      venue: formData.get('venue'),
      organizer: formData.get('organizer'),
      imageUrl: formData.get('imageUrl'),
      status: formData.get('status'),
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'upcoming': return 'secondary';
      case 'ongoing': return 'default';
      case 'past': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeBadgeVariant = (type) => {
    return type === 'hackathon' ? 'destructive' : 'default';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">External Events</h1>
            <p className="text-muted-foreground">Manage external events and hackathons</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add External Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Edit External Event' : 'Add External Event'}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent ? 'Update the external event details.' : 'Create a new external event or hackathon.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Title *</label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingEvent?.title || ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium">Type *</label>
                    <Select name="type" defaultValue={editingEvent?.type || 'event'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="hackathon">Hackathon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description *</label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingEvent?.description || ''}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="link" className="text-sm font-medium">Link *</label>
                    <Input
                      id="link"
                      name="link"
                      type="url"
                      defaultValue={editingEvent?.link || ''}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium">Date *</label>
                    <Input
                      id="date"
                      name="date"
                      type="datetime-local"
                      defaultValue={editingEvent?.date ? format(new Date(editingEvent.date), "yyyy-MM-dd'T'HH:mm") : ''}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="venue" className="text-sm font-medium">Venue</label>
                    <Input
                      id="venue"
                      name="venue"
                      defaultValue={editingEvent?.venue || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="organizer" className="text-sm font-medium">Organizer</label>
                    <Input
                      id="organizer"
                      name="organizer"
                      defaultValue={editingEvent?.organizer || ''}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="imageUrl" className="text-sm font-medium">Image URL</label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      defaultValue={editingEvent?.imageUrl || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">Status *</label>
                    <Select name="status" defaultValue={editingEvent?.status || 'upcoming'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {editingEvent ? 'Update' : 'Create'} Event
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Events Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {event.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(event.type)}>
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.date), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.organizer && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {event.organizer}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(event.link, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(event)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete External Event</AlertDialogTitle>
                              <AlertDialogTitle>
                                Are you sure you want to delete "{event.title}"? This action cannot be undone.
                              </AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(event._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {events?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No external events found. Create your first one!</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}