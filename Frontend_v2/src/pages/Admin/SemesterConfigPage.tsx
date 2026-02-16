import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { semesterStorage, type Semester } from '@/utils/semesterStorage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';

export default function SemesterConfigPage() {
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isCurrent: false,
  });

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = () => {
    const allSemesters = semesterStorage.getSemesters();
    setSemesters(allSemesters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({
        title: 'Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }

    if (selectedId) {
      const updated = semesterStorage.updateSemester(selectedId, formData);
      if (updated) {
        toast({
          title: 'Success',
          description: 'Semester updated successfully',
        });
      }
    } else {
      semesterStorage.addSemester(formData);
      toast({
        title: 'Success',
        description: 'Semester added successfully',
      });
    }
    
    setShowDialog(false);
    resetForm();
    loadSemesters();
  };

  const handleEdit = (semester: Semester) => {
    setSelectedId(semester.id);
    setFormData({
      name: semester.name,
      code: semester.code,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isActive: semester.isActive,
      isCurrent: semester.isCurrent,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedId) return;
    
    const success = semesterStorage.deleteSemester(selectedId);
    if (success) {
      toast({
        title: 'Success',
        description: 'Semester deleted successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Cannot delete the only semester',
        variant: 'destructive',
      });
    }
    
    setShowDeleteDialog(false);
    setSelectedId(null);
    loadSemesters();
  };

  const handleToggleStatus = (id: string, field: 'isActive' | 'isCurrent') => {
    const semester = semesters.find(s => s.id === id);
    if (!semester) return;
    
    const updates = { [field]: !semester[field] };
    semesterStorage.updateSemester(id, updates);
    loadSemesters();
    
    toast({
      title: 'Updated',
      description: `Semester ${field === 'isActive' ? 'status' : 'current flag'} updated`,
    });
  };

  const resetToDefaults = () => {
    semesterStorage.resetToDefaults();
    loadSemesters();
    toast({
      title: 'Reset Complete',
      description: 'Semesters have been reset to defaults',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      startDate: '',
      endDate: '',
      isActive: true,
      isCurrent: false,
    });
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semester Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage academic terms (stored locally in your browser)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={resetToDefaults} className="sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={() => setShowDialog(true)} className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Semester
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Note:</strong> Semester data is stored locally in your browser's storage. 
          Changes will only affect your current browser/session.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Semester
          </CardTitle>
        </CardHeader>
        <CardContent>
          {semesters.find(s => s.isCurrent) ? (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {semesters.find(s => s.isCurrent)?.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      {semesters.find(s => s.isCurrent)?.code}
                    </span>
                    <span className="hidden sm:block">•</span>
                    <span>
                      {new Date(semesters.find(s => s.isCurrent)!.startDate).toLocaleDateString()} -{' '}
                      {new Date(semesters.find(s => s.isCurrent)!.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge variant="default" className="self-start sm:self-center">Active & Current</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No semester marked as current</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Semesters</CardTitle>
          <CardDescription>
            {semesters.length} semester(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {semesters.map((semester) => (
              <div 
                key={semester.id} 
                className={`p-4 border rounded-lg hover:bg-muted/50 ${
                  semester.isCurrent ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold truncate">{semester.name}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {semester.code}
                      </Badge>
                      {semester.isCurrent && (
                        <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                          Current
                        </Badge>
                      )}
                      {!semester.isActive && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {new Date(semester.startDate).toLocaleDateString()} -{' '}
                        {new Date(semester.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(semester.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`active-${semester.id}`}
                          checked={semester.isActive}
                          onCheckedChange={() => handleToggleStatus(semester.id, 'isActive')}
                        />
                        <Label htmlFor={`active-${semester.id}`} className="text-sm cursor-pointer">
                          Active
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`current-${semester.id}`}
                          checked={semester.isCurrent}
                          onCheckedChange={() => handleToggleStatus(semester.id, 'isCurrent')}
                          disabled={!semester.isActive}
                        />
                        <Label htmlFor={`current-${semester.id}`} className="text-sm cursor-pointer">
                          Current
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(semester)}
                        className="h-9 w-9 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(semester.id)}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {selectedId ? 'Edit Semester' : 'Add New Semester'}
            </DialogTitle>
            <DialogDescription>
              Configure semester details for academic tracking
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="required">
                    Semester Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Fall 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="required">
                    Semester Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="2024-FALL"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="required">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="required">
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Switch
                      id="isCurrent"
                      checked={formData.isCurrent}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, isCurrent: checked})
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="isCurrent" className="font-medium cursor-pointer">
                          Mark as Current Semester
                        </Label>
                        {formData.isCurrent && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs whitespace-nowrap">
                            Only one current allowed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This will be the default for new syllabus uploads
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, isActive: checked})
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="font-medium cursor-pointer">
                        Active
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Available for selection
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full">
                <Button
                variant="outline"
                type="button"
                onClick={() => setShowDialog(false)}
                className="w-full order-2 sm:order-1"
                >
                Cancel
                </Button>
                <Button
                type="submit"
                className="w-full order-1 sm:order-2"
                >
                {selectedId ? 'Update' : 'Create'} Semester
                </Button>
            </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this semester? This action cannot be undone.
              Syllabus submissions linked to this semester will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}