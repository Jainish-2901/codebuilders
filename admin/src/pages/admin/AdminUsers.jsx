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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; 
import { Calendar } from "@/components/ui/calendar"; 
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Pencil, Trash2, Loader2, Eye, EyeOff, CalendarDays, 
  Search, Download, X, Calendar as CalendarIcon, Phone 
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { cn } from "@/lib/utils";

export default function AdminUsers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // ✅ States for Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState(null); // { from: Date, to: Date }

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all users with Auto-Refetch (Live Status Update)
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.getAllUsers(),
    refetchInterval: 5000, // ✅ Check status every 5 seconds
  });

  // 1. Filter by Role 'user'
  const standardUsers = users?.filter(user => user.role === 'user') || [];

  // 2. Apply Search & Date Filters
  const filteredUsers = standardUsers.filter(user => {
    // Search Filter (Name, Email, or Phone)
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      (user.phone && user.phone.includes(term));

    // Date Range Filter
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to && user.createdAt) {
      const joinedDate = new Date(user.createdAt);
      matchesDate = isWithinInterval(joinedDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    }

    return matchesSearch && matchesDate;
  });

  // ✅ Download CSV Function (Includes Phone)
  const downloadCSV = () => {
    if (filteredUsers.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = ["Name,Email,Phone,Joined Date,Status,Account Active"];
    const rows = filteredUsers.map(user => [
      `"${user.name}"`,
      `"${user.email}"`,
      `"${user.phone || 'N/A'}"`, // ✅ Ensure phone is exported
      `"${user.createdAt ? format(new Date(user.createdAt), 'yyyy-MM-dd') : ''}"`,
      user.isLoggedIn ? "Online" : "Offline",
      user.isActive ? "Active" : "Inactive"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeDialog();
      toast({ title: 'User created successfully' });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.updateUser(data._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeDialog();
      toast({ title: 'User updated successfully' });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error) => toast({ variant: 'destructive', title: 'Error', description: error.message }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'), // ✅ Capture Phone
      role: 'user', 
      isActive: formData.get('isActive') === 'on',
      ...(formData.get('password') && { password: formData.get('password') }),
    };
    if (editingUser) updateMutation.mutate({ ...userData, _id: editingUser._id });
    else createMutation.mutate(userData);
  };

  const openCreateDialog = () => { setEditingUser(null); setIsDialogOpen(true); };
  const openEditDialog = (user) => { setEditingUser(user); setIsDialogOpen(true); };
  const closeDialog = () => { setIsDialogOpen(false); setEditingUser(null); setShowPassword(false); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Standard Users</h2>
            <p className="text-muted-foreground">Manage registered website users</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
          
          <div className="flex flex-1 gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email or phone..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal w-[240px]", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Filter by Joining Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters Button */}
            {(searchTerm || dateRange) && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { setSearchTerm(""); setDateRange(null); }}
                title="Clear Filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Download CSV Button */}
          <Button variant="outline" onClick={downloadCSV} className="w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Users Table */}
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
                    <TableHead>Phone</TableHead> {/* ✅ Phone Column Header */}
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      
                      {/* ✅ Phone Data Cell */}
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                             <Phone className="w-3 h-3" />
                             <span className="text-sm">{user.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell>
                          <Badge 
                            variant="outline" 
                            className={user.isLoggedIn 
                                ? "border-green-500 text-green-500 bg-green-500/10" 
                                : "border-slate-500 text-slate-500 bg-slate-500/10"
                            }
                          >
                            {user.isLoggedIn ? "Online" : "Offline"}
                          </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge 
                          variant={user.isActive ? 'default' : 'secondary'} 
                          className={user.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(user._id)}
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
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialogs (Create/Edit) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User Details' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update basic details and status." : "Create a new user account manually."}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" defaultValue={editingUser?.name} required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingUser ? "New Password (Optional)" : "Password"}</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder={editingUser ? "Leave blank to keep same" : "Enter password"} required={!editingUser} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* ✅ Phone Input in Dialog */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={editingUser?.phone} placeholder="+91 9876543210" />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Switch id="isActive" name="isActive" defaultChecked={editingUser ? editingUser.isActive : true} />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingUser ? 'Update Details' : 'Create User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>
    </AdminLayout>
  );
}