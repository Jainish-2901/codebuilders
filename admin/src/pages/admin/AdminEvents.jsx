import { useState, useRef } from 'react';
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
  AlertDialogDescription, // ✅ Added Description
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Ticket, Image as ImageIcon, MapPin } from 'lucide-react';
import { format, isPast } from 'date-fns'; 

export default function AdminEvents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const fileInputRef = useRef(null);
  
  const [regEnabled, setRegEnabled] = useState(true);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      return await apiClient.getEvents();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData) => await apiClient.createEvent(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setIsDialogOpen(false);
      toast({ title: 'Event created successfully' });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      return await apiClient.updateEvent(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast({ title: 'Event updated successfully' });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (_id) => await apiClient.deleteEvent(_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: 'Event deleted successfully' });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });

  const getEventDateParts = (isoString) => {
    if (!isoString) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { 
            date: format(tomorrow, 'yyyy-MM-dd'), 
            hour: '9', 
            minute: '00', 
            ampm: 'AM' 
        };
    }
    
    const d = new Date(isoString);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    
    h = h % 12;
    h = h ? h : 12;

    return {
      date: format(d, 'yyyy-MM-dd'),
      hour: h.toString(),
      minute: m.toString().padStart(2, '0'), 
      ampm
    };
  };

  const defaultParts = getEventDateParts(editingEvent?.dateTime);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const datePart = formData.get('datePart');
    const hourPart = formData.get('timeHour');
    const minutePart = formData.get('timeMinute');
    const ampmPart = formData.get('timeAmPm');

    let hour24 = parseInt(hourPart, 10);
    if (ampmPart === 'PM' && hour24 !== 12) hour24 += 12;
    if (ampmPart === 'AM' && hour24 === 12) hour24 = 0;

    const finalIsoString = new Date(`${datePart}T${hour24.toString().padStart(2, '0')}:${minutePart}:00`).toISOString();
    
    formData.set('dateTime', finalIsoString);
    formData.delete('datePart');
    formData.delete('timeHour');
    formData.delete('timeMinute');
    formData.delete('timeAmPm');

    formData.set('isRegistrationEnabled', String(regEnabled)); 
    
    const status = new Date(finalIsoString) < new Date() ? 'past' : 'upcoming';
    formData.set('status', status);
    
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (event) => {
    setEditingEvent(event);
    setRegEnabled(event.isRegistrationEnabled ?? true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setRegEnabled(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Events</h2>
            <p className="text-muted-foreground">Manage events and registrations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEvent(null);
                setRegEnabled(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
                <DialogDescription>
                  Configure event details and settings.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 mt-4" encType="multipart/form-data">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Basic Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" defaultValue={editingEvent?.title} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue (Display Name)</Label>
                      <Input id="venue" name="venue" defaultValue={editingEvent?.venue} required placeholder="e.g. Grand Hall, NYC" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mapUrl" className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      Google Maps Link
                    </Label>
                    <Input 
                      id="mapUrl" 
                      name="mapUrl" 
                      defaultValue={editingEvent?.mapUrl} 
                      placeholder="Paste Google Maps Share Link here..." 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingEvent?.description ?? ''} rows={2} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullDescription">Full Description</Label>
                    <Textarea id="fullDescription" name="fullDescription" defaultValue={editingEvent?.fullDescription ?? ''} rows={4} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="datePart">Date</Label>
                      <Input
                        id="datePart"
                        name="datePart"
                        type="date"
                        defaultValue={defaultParts.date}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                            <select 
                                name="timeHour" 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue={defaultParts.hour}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>
                        
                        <span className="self-center font-bold">:</span>
                        
                        <div className="flex-1">
                             <select 
                                name="timeMinute" 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue={defaultParts.minute}
                            >
                                {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                                    const minStr = m.toString().padStart(2, '0');
                                    return <option key={minStr} value={minStr}>{minStr}</option>;
                                })}
                            </select>
                        </div>

                        <div className="flex-1">
                            <select 
                                name="timeAmPm" 
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue={defaultParts.ampm}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="maxAttendees">Max Attendees</Label>
                      <Input id="maxAttendees" name="maxAttendees" type="number" defaultValue={editingEvent?.maxAttendees ?? 500} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                      <Label htmlFor="image">Event Cover Image</Label>
                      <Input id="image" name="image" type="file" accept="image/*" ref={fileInputRef} />
                      
                      {editingEvent?.imageUrl && (
                        <div className="mt-2 w-full h-32 rounded-md overflow-hidden border border-border relative group">
                          <img 
                            src={editingEvent.imageUrl} 
                            alt="Current Event" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Current Cover
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="memoriesUrl">Memories Album Link</Label>
                      <Input 
                        id="memoriesUrl" 
                        name="memoriesUrl" 
                        type="url" 
                        placeholder="https://photos.google.com/share/..." 
                        defaultValue={editingEvent?.memoriesUrl ?? ''} 
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        Paste the link to your external photo album (Google Drive/Photos).
                        A "View Album" button will appear on the event page.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      id="isRegistrationEnabled"
                      checked={regEnabled}
                      onCheckedChange={setRegEnabled}
                    />
                    <Label htmlFor="isRegistrationEnabled">Enable Registration</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </DialogFooter>
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
                    <TableHead>Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((event) => {
                    const isEventPast = isPast(new Date(event.dateTime));
                    
                    return (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {event.imageUrl ? (
                            <img src={event.imageUrl} className="w-8 h-8 rounded object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          {event.title}
                        </TableCell>
                        
                        <TableCell>
                            {event.dateTime 
                                ? format(new Date(event.dateTime), 'MMM d, yyyy h:mm a') 
                                : 'TBA'}
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={isEventPast ? 'secondary' : 'default'} className={isEventPast ? 'text-muted-foreground' : ''}>
                            {isEventPast ? 'Ended' : 'Upcoming'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                            {event.isRegistrationEnabled ? (
                              <Badge variant="outline" className="border-blue-500 text-blue-500 gap-1">
                                <Ticket className="w-3 h-3" /> Open
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground gap-1">
                                Closed
                              </Badge>
                            )}
                        </TableCell>
                        
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          
                          {/* ✅ AlertDialog Added Here */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{event.title}</strong>?
                                  <br />
                                  This will also remove all associated registrations and data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(event._id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}