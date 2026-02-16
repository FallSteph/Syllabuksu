import React, { useState, useMemo } from 'react';
import { Users, CheckCircle2, XCircle, Plus, Pencil, Archive, Search, Filter, Key, Copy, Building2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, Mail, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { ROLE_LABELS, COLLEGES, DEPARTMENTS, UserRole, User } from '@/types';

export default function ManageUsersPage() {
  const { pendingUsers, allUsers, approveUser, rejectUser, addUser, updateUser, archiveUser } = useData();
  const { toast } = useToast();
  
  // Basic filter states that I'll use throughout the component
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  // Pagination setup - keeping it at 20 items per page for good balance
  const [currentPendingPage, setCurrentPendingPage] = useState(1);
  const [currentExistingPage, setCurrentExistingPage] = useState(1);
  const itemsPerPage = 20;
  
  // Dialog states for managing user interactions
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Confirmation dialog states - I separated these for clarity
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<{id: string, name: string, type: 'archive' | 'approve' | 'reject'} | null>(null);
  
  // Form state for adding/editing users
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'faculty' as UserRole,
    college: '',
    department: '',
  });

  // Password generation state - keeping this separate from form data
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sorting states for both tabs
  const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [existingSortOrder, setExistingSortOrder] = useState<'asc' | 'desc' | null>(null);

  // Memoizing departments based on selected college to avoid recalculating
  const availableDepartments = useMemo(() => {
    if (!collegeFilter || collegeFilter === 'all') {
      return [];
    }
    return DEPARTMENTS[collegeFilter] || [];
  }, [collegeFilter]);

  // Helper to check if any filters are active - for the clear filters button
  const hasActiveFilters = searchQuery || roleFilter !== 'all' || collegeFilter !== 'all' || departmentFilter !== 'all';

  // Check if selected role is admin, CITL, or VPAA
  const isAdminRoleSelected = useMemo(() => {
    return roleFilter === 'admin' || roleFilter === 'citl' || roleFilter === 'vpaa';
  }, [roleFilter]);

  // Resetting all filters and pagination
  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setCollegeFilter('all');
    setDepartmentFilter('all');
    setCurrentPendingPage(1);
    setCurrentExistingPage(1);
    setPendingSortOrder(null);
    setExistingSortOrder(null);
  };

  // Simple password generator function
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  // Clipboard functionality for passwords
  const copyPasswordToClipboard = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    toast({ title: 'Password Copied', description: 'Password has been copied to clipboard.' });
  };

  // Opening confirmation dialogs with user data
  const openArchiveConfirm = (userId: string, name: string) => {
    setUserToAction({ id: userId, name, type: 'archive' });
    setIsArchiveConfirmOpen(true);
  };

  const openApproveConfirm = (userId: string, name: string) => {
    setUserToAction({ id: userId, name, type: 'approve' });
    setIsApproveConfirmOpen(true);
  };

  const openRejectConfirm = (userId: string, name: string) => {
    setUserToAction({ id: userId, name, type: 'reject' });
    setIsRejectConfirmOpen(true);
  };

  // Handling actions after user confirms
  const handleArchiveConfirm = () => {
    if (!userToAction) return;
    
    archiveUser(userToAction.id);
    toast({ title: 'User Archived', description: `${userToAction.name} has been archived.` });
    setIsArchiveConfirmOpen(false);
    setUserToAction(null);
  };

  const handleApproveConfirm = () => {
    if (!userToAction) return;
    
    approveUser(userToAction.id);
    toast({ title: 'User Approved', description: `${userToAction.name} can now log in.` });
    setIsApproveConfirmOpen(false);
    setUserToAction(null);
  };

  const handleRejectConfirm = () => {
    if (!userToAction) return;
    
    rejectUser(userToAction.id);
    toast({ variant: 'destructive', title: 'User Rejected', description: `${userToAction.name}'s request has been rejected.` });
    setIsRejectConfirmOpen(false);
    setUserToAction(null);
  };

  // Adding a new user with validation
  const handleAddUser = () => {
    // Updated validation to include department
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.college || !formData.department) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }
    
    addUser({
      ...formData,
      isApproved: true,
      notificationsEnabled: true,
    }, generatedPassword || undefined);
    
    toast({ title: 'User Added', description: `${formData.firstName} ${formData.lastName} has been added.` });
    if (generatedPassword) {
      toast({
        title: 'Password Generated',
        description: `New password for ${formData.firstName} ${formData.lastName}: ${generatedPassword}`,
        variant: 'default'
      });
    }
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Updating existing user
  const handleEditUser = () => {
    if (!selectedUser) return;
    
    // Optional: Add validation for edit if needed
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.college || !formData.department) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }
    
    updateUser(selectedUser.id, formData);
    toast({ title: 'User Updated', description: `${formData.firstName} ${formData.lastName} has been updated.` });
    
    // Show password in toast if one was generated
    if (generatedPassword) {
      toast({ 
        title: 'Password Generated', 
        description: `New password for ${formData.firstName} ${formData.lastName}: ${generatedPassword}`,
        variant: 'default'
      });
    }
    
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    setGeneratedPassword('');
    setShowPassword(false);
    resetForm();
  };

  // Opening edit dialog with user data pre-filled
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      college: user.college,
      department: user.department,
    });
    setGeneratedPassword('');
    setShowPassword(false);
    setIsEditDialogOpen(true);
  };

  // Resetting form to initial state
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'faculty',
      college: '',
      department: '',
    });
  };

  // Filter existing users based on current filters
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesCollege = collegeFilter === 'all' || user.college === collegeFilter;
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
      
      return matchesSearch && matchesRole && matchesCollege && matchesDepartment;
    });
  }, [allUsers, searchQuery, roleFilter, collegeFilter, departmentFilter]);

  // Filter pending users separately
  const filteredPendingUsers = useMemo(() => {
    return pendingUsers.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesCollege = collegeFilter === 'all' || user.college === collegeFilter;
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
      
      return matchesSearch && matchesRole && matchesCollege && matchesDepartment;
    });
  }, [pendingUsers, searchQuery, roleFilter, collegeFilter, departmentFilter]);

  // Sort pending users by name
  const sortedPendingUsers = useMemo(() => {
    if (!pendingSortOrder) return filteredPendingUsers;
    
    return [...filteredPendingUsers].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      
      if (pendingSortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }, [filteredPendingUsers, pendingSortOrder]);

  // Sort existing users by name
  const sortedExistingUsers = useMemo(() => {
    if (!existingSortOrder) return filteredUsers;
    
    return [...filteredUsers].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      
      if (existingSortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }, [filteredUsers, existingSortOrder]);

  // Toggle sort order for pending users
  const togglePendingSort = () => {
    if (pendingSortOrder === null) {
      setPendingSortOrder('asc');
    } else if (pendingSortOrder === 'asc') {
      setPendingSortOrder('desc');
    } else {
      setPendingSortOrder(null);
    }
  };

  // Toggle sort order for existing users
  const toggleExistingSort = () => {
    if (existingSortOrder === null) {
      setExistingSortOrder('asc');
    } else if (existingSortOrder === 'asc') {
      setExistingSortOrder('desc');
    } else {
      setExistingSortOrder(null);
    }
  };

  // Pagination calculations
  const totalExistingPages = Math.ceil(sortedExistingUsers.length / itemsPerPage);
  const totalPendingPages = Math.ceil(sortedPendingUsers.length / itemsPerPage);
  
  // Getting current page items - reusable for both user lists
  const getCurrentPagePendingItems = () => {
    const startIndex = (currentPendingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedPendingUsers.slice(startIndex, endIndex);
  };

  const getCurrentPageExistingItems = () => {
    const startIndex = (currentExistingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedExistingUsers.slice(startIndex, endIndex);
  };

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPendingPage(1);
    setCurrentExistingPage(1);
  }, [searchQuery, roleFilter, collegeFilter, departmentFilter]);

  // Helper function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 25) => {
    if (!text || text === '-') return '-';
    if (text.length <= maxLength) return text;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = text.lastIndexOf(' ', maxLength - 3);
    const cutPoint = lastSpace > maxLength - 10 ? lastSpace : maxLength - 3;
    
    return text.substring(0, cutPoint) + '...';
  };

  // Helper function to shorten college/department names
  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text || text === '-') return '-';
    
    // Remove common prefixes
    let shortened = text
      .replace('College of ', '')
      .replace('Department of ', '')
      .replace('Center for ', '')
      .replace('School of ', '');
    
    // Truncate if still too long
    return truncateText(shortened, maxLength);
  };

  // Mobile Card Component - Updated without profile icon
  const UserCard = ({ user, type = 'existing' }: { user: User; type?: 'pending' | 'existing' }) => (
    <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Removed the profile icon section */}
        <div className="mb-3">
          <h3 className="font-semibold text-foreground">{user.firstName} {user.lastName}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        
        {/* Rest of the component remains the same */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Role</p>
            <Badge variant="secondary" className="text-xs">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">College</p>
            <p className="text-sm truncate" title={user.college}>
              {shortenText(user.college, 20)}
            </p>
          </div>
        </div>
        
        {user.department && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Department</p>
            <p className="text-sm truncate" title={user.department}>
              {shortenText(user.department, 25)}
            </p>
          </div>
        )}
        
        <div className="flex gap-2 pt-3 border-t">
          {type === 'pending' ? (
            <>
              <Button 
                type="button"
                variant="default"
                size="sm" 
                onClick={() => openApproveConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                className="flex-1 gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button 
                type="button"
                variant="destructive" 
                size="sm" 
                onClick={() => openRejectConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                className="flex-1 gap-1"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button"
                variant="outline"
                size="sm" 
                onClick={() => openEditDialog(user)}
                className="flex-1 gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button 
                type="button"
                variant="destructive" 
                size="sm" 
                onClick={() => openArchiveConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                className="flex-1 gap-1"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Pagination component - reusable for both tabs
  const Pagination = ({ totalPages, currentPage, onPageChange, itemsCount, tabType }: {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    itemsCount: number;
    tabType: 'pending' | 'existing';
  }) => {
    if (totalPages <= 1 && itemsCount === 0) return null;

    // Get the range of items being shown
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, itemsCount);

    // Generating page numbers with ellipsis for large page counts
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="border-t pt-4 mt-4">
        {/* Showing X-Y of Z users */}
        <div className="text-sm text-muted-foreground mb-4 text-center">
          Showing <span className="font-medium text-foreground">{startIndex}-{endIndex}</span> of{' '}
          <span className="font-medium text-foreground">{itemsCount}</span>{' '}
          {tabType === 'pending' ? 'pending users' : 'users'}
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`dots-${index}`} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    type="button"
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground">Manage user registrations and accounts</p>
        </div>
        
        {/* Add User Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base">Add New User</DialogTitle>
              <DialogDescription className="text-xs">
                Create a new user account. The user will be able to log in immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2.5 py-2">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="add-firstName" className="text-xs">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="add-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-lastName" className="text-xs">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="add-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-email" className="text-xs">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@syllabo.edu"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-role" className="text-xs">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="h-8 text-sm text-left">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-sm">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="add-college" className="text-xs">
                    College <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.college} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, college: value, department: '' }))}
                  >
                    <SelectTrigger className="h-8 text-sm text-left">
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {COLLEGES.map((college) => (
                        <SelectItem key={college} value={college} className="text-sm">{college}</SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="add-department" className="text-xs">
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                    disabled={!formData.college || !DEPARTMENTS[formData.college]}
                  >
                    <SelectTrigger className="h-8 text-sm text-left">
                      <SelectValue placeholder={!formData.college ? "Select college first" : "Select department"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {formData.college && DEPARTMENTS[formData.college]?.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-sm">{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-8 text-sm">Cancel</Button>
              <Button type="button" onClick={handleAddUser} className="h-8 text-sm">Add User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters Card */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value);
                // If admin role is selected, reset college and department filters
                if (value === 'admin' || value === 'citl' || value === 'vpaa') {
                  setCollegeFilter('all');
                  setDepartmentFilter('all');
                }
              }}>
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue placeholder="Role" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all" className="text-sm truncate">All Roles</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-sm truncate">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* College filter */}
            <div className="relative">
              <Select 
                value={collegeFilter} 
                onValueChange={(value) => {
                  setCollegeFilter(value);
                  setDepartmentFilter('all');
                }}
                disabled={isAdminRoleSelected}
              >
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue 
                        placeholder={isAdminRoleSelected ? "Not applicable for selected role" : "College"}
                      />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all" className="text-sm truncate">All Colleges</SelectItem>
                  {COLLEGES.map(college => (
                    <SelectItem key={college} value={college} className="text-sm truncate">
                      {college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department filter */}
            <div className="relative">
              <Select 
                value={departmentFilter} 
                onValueChange={setDepartmentFilter}
                disabled={isAdminRoleSelected || collegeFilter === 'all' || availableDepartments.length === 0}
              >
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue 
                        placeholder={
                          isAdminRoleSelected ? "Not applicable for selected role" :
                          collegeFilter === 'all' || availableDepartments.length === 0 ? 
                          "Select college first" : "Department"
                        }
                      />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all" className="text-sm truncate">All Departments</SelectItem>
                  {availableDepartments.map(dept => (
                    <SelectItem key={dept} value={dept} className="text-sm truncate">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Pending and Existing Users */}
      <Tabs defaultValue="pending" className="space-y-4" onValueChange={() => {
        setCurrentPendingPage(1);
        setCurrentExistingPage(1);
        setPendingSortOrder(null);
        setExistingSortOrder(null);
      }}>
        <TabsList className="grid w-full grid-cols-2 max-w-md h-10">
          <TabsTrigger value="pending" className="gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Pending Approval ({filteredPendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="existing" className="gap-2 text-sm">
            <Users className="h-4 w-4" />
            Existing Users ({filteredUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Users Tab */}
        <TabsContent value="pending">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  Pending Registration Approval
                </CardTitle>
                {hasActiveFilters && filteredPendingUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {filteredPendingUsers.length} result{filteredPendingUsers.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredPendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No pending users</h3>
                  <p className="text-muted-foreground">All user registrations have been processed.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View - hidden on large screens */}
                  <div className="lg:hidden space-y-3">
                    {getCurrentPagePendingItems().map((user) => (
                      <UserCard key={user.id} user={user} type="pending" />
                    ))}
                  </div>
                  
                  {/* Desktop Table View - hidden on mobile */}
                  <div className="hidden lg:block">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold py-2 px-3 w-[160px]">
                              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={togglePendingSort}>
                                Name
                                <div className="flex flex-col">
                                  <ChevronUp 
                                    className={`h-4 w-4 -mb-1 ${pendingSortOrder === 'asc' ? 'text-yellow-500' : 'text-muted-foreground'}`} 
                                  />
                                  <ChevronDown 
                                    className={`h-4 w-4 -mt-1 ${pendingSortOrder === 'desc' ? 'text-yellow-500' : 'text-muted-foreground'}`} 
                                  />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[170px]">Email</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[90px]">Role</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[110px]">College</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[120px]">Department</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[150px] text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getCurrentPagePendingItems().map((user) => (
                            <TableRow key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                              <TableCell className="py-2 px-3">
                                <div className="font-medium text-sm">
                                  {user.firstName} {user.lastName}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="text-sm text-muted-foreground truncate" title={user.email}>
                                  {user.email}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <Badge 
                                  variant="secondary" 
                                  className="inline-flex justify-center items-center text-xs px-2 py-0.5 whitespace-nowrap"
                                >
                                  {ROLE_LABELS[user.role]}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="text-sm truncate" title={user.college}>
                                  {shortenText(user.college, 20)}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="text-sm truncate" title={user.department}>
                                  {shortenText(user.department, 25)}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    type="button"
                                    variant="default"
                                    size="sm" 
                                    onClick={() => openApproveConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                                    className="gap-1 h-7 px-2 text-xs"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button 
                                    type="button"
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => openRejectConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                                    className="gap-1 h-7 px-2 text-xs"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <Pagination 
                    totalPages={totalPendingPages}
                    currentPage={currentPendingPage}
                    onPageChange={setCurrentPendingPage}
                    itemsCount={sortedPendingUsers.length}
                    tabType="pending"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Existing Users Tab */}
        <TabsContent value="existing">
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Existing Users
                </CardTitle>
                {hasActiveFilters && filteredUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found matching your filters.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View - hidden on large screens */}
                  <div className="lg:hidden space-y-3">
                    {getCurrentPageExistingItems().map((user) => (
                      <UserCard key={user.id} user={user} type="existing" />
                    ))}
                  </div>
                  
                  {/* Desktop Table View - hidden on mobile */}
                  <div className="hidden lg:block">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold py-2 px-3 w-[160px]">
                              <div className="flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={toggleExistingSort}>
                                Name
                                <div className="flex flex-col">
                                  <ChevronUp 
                                    className={`h-4 w-4 -mb-1 ${existingSortOrder === 'asc' ? 'text-yellow-500' : 'text-muted-foreground'}`} 
                                  />
                                  <ChevronDown 
                                    className={`h-4 w-4 -mt-1 ${existingSortOrder === 'desc' ? 'text-yellow-500' : 'text-muted-foreground'}`} 
                                  />
                                </div>
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[170px]">Email</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[90px]">Role</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[110px]">College</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[120px]">Department</TableHead>
                            <TableHead className="font-semibold py-2 px-3 w-[130px] text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getCurrentPageExistingItems().map((user) => (
                            <TableRow key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                              <TableCell className="py-2 px-3">
                                <div className="font-medium text-sm">
                                  {user.firstName} {user.lastName}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="text-sm text-muted-foreground truncate" title={user.email}>
                                  {user.email}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <Badge 
                                  variant="secondary" 
                                  className="inline-flex justify-center items-center text-xs px-2 py-0.5 whitespace-nowrap"
                                >
                                  {ROLE_LABELS[user.role]}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="text-sm truncate" title={user.college}>
                                  {shortenText(user.college, 20)}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="text-sm truncate" title={user.department}>
                                  {shortenText(user.department, 25)}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 px-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    size="sm" 
                                    onClick={() => openEditDialog(user)}
                                    className="gap-1 h-7 px-2 text-xs"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button 
                                    type="button"
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => openArchiveConfirm(user.id, `${user.firstName} ${user.lastName}`)}
                                    className="gap-1 h-7 px-2 text-xs"
                                  >
                                    <Archive className="h-3 w-3" />
                                    Archive
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <Pagination 
                    totalPages={totalExistingPages}
                    currentPage={currentExistingPage}
                    onPageChange={setCurrentExistingPage}
                    itemsCount={sortedExistingUsers.length}
                    tabType="existing"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Edit User</DialogTitle>
            <DialogDescription className="text-xs">
              Update user account information. Generate a new password if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2.5 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="edit-firstName" className="text-xs">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-lastName" className="text-xs">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email" className="text-xs">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@syllabo.edu"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-role" className="text-xs">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="h-8 text-sm text-left">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-sm">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="edit-college" className="text-xs">
                  College <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.college} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, college: value, department: '' }))}
                >
                  <SelectTrigger className="h-8 text-sm text-left">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {COLLEGES.map((college) => (
                      <SelectItem key={college} value={college} className="text-sm">{college}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-department" className="text-xs">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  disabled={!formData.college || !DEPARTMENTS[formData.college]}
                >
                  <SelectTrigger className="h-8 text-sm text-left">
                    <SelectValue placeholder={!formData.college ? "Select college first" : "Select department"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {formData.college && DEPARTMENTS[formData.college]?.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-sm">{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Password Reset</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={generatePassword}
                className="h-7 gap-1 text-xs"
              >
                <Key className="h-3 w-3" />
                Generate Password
              </Button>
            </div>
            {generatedPassword && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Input
                    value={generatedPassword}
                    readOnly
                    type={showPassword ? "text" : "password"}
                    className="h-8 text-sm font-mono"
                    placeholder="Click 'Generate Password' to create a new password"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPasswordToClipboard}
                    className="h-8 px-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This password will be shown in a confirmation toast after saving.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="h-8 text-sm">Cancel</Button>
            <Button type="button" onClick={handleEditUser} className="h-8 text-sm">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Archive User
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to archive this user?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertDescription className="text-sm">
              Archiving <span className="font-semibold">{userToAction?.name}</span> will:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Remove the user from active lists</li>
                <li>Preserve their data in the system</li>
                <li>Prevent them from logging in</li>
                <li>Can be restored by an administrator if needed</li>
              </ul>
            </AlertDescription>
          </Alert>
          <DialogFooter className="pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsArchiveConfirmOpen(false)} 
              className="h-8 text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive" 
              onClick={handleArchiveConfirm} 
              className="h-8 text-sm"
            >
              Archive User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={isApproveConfirmOpen} onOpenChange={setIsApproveConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Approve User
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to approve this user registration?
            </DialogDescription>
          </DialogHeader>
          <Alert className="bg-success/10 border-success/20">
            <AlertDescription className="text-sm">
              Approving <span className="font-semibold">{userToAction?.name}</span> will:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Grant them access to log in to the system</li>
                <li>Allow them to create and manage syllabi</li>
                <li>Send them a confirmation email (if configured)</li>
                <li>Move them to the active users list</li>
              </ul>
            </AlertDescription>
          </Alert>
          <DialogFooter className="pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsApproveConfirmOpen(false)} 
              className="h-8 text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="default" 
              onClick={handleApproveConfirm} 
              className="h-8 text-sm bg-success hover:bg-success/90"
            >
              Approve User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectConfirmOpen} onOpenChange={setIsRejectConfirmOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject User
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to reject this user registration?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertDescription className="text-sm">
              Rejecting <span className="font-semibold">{userToAction?.name}</span> will:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                <li>Permanently delete their registration request</li>
                <li>Remove them from the pending users list</li>
                <li>Send them a rejection email (if configured)</li>
                <li>Require them to submit a new registration if they want to join</li>
              </ul>
            </AlertDescription>
          </Alert>
          <DialogFooter className="pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsRejectConfirmOpen(false)} 
              className="h-8 text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive" 
              onClick={handleRejectConfirm} 
              className="h-8 text-sm"
            >
              Reject User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
