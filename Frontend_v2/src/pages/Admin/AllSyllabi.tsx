import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, FileText, Building2, Calendar, Eye, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, Send, CheckCircle2, XCircle, FileSearch, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { COLLEGES, DEPARTMENTS, SEMESTERS, SyllabusStatus, STATUS_LABELS } from '@/types';
import { format } from 'date-fns';

// Helper function to get badge variant based on status (matching StatusBadge)
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'muted' => {
  const variantMap = {
    draft: 'muted' as const,
    submitted: 'info' as const,
    under_review_dept_head: 'warning' as const,
    under_review_dean: 'warning' as const,
    under_review_citl: 'warning' as const,
    under_review_vpaa: 'warning' as const,
    approved: 'success' as const,
    returned: 'destructive' as const,
  };
  return variantMap[status as keyof typeof variantMap] || 'default';
};

// Helper function to get status icon (matching StatusBadge)
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft':
      return <Clock className="h-3 w-3 mr-1.5" />;
    case 'submitted':
      return <Send className="h-3 w-3 mr-1.5" />;
    case 'under_review_dept_head':
    case 'under_review_dean':
    case 'under_review_citl':
    case 'under_review_vpaa':
      return <FileSearch className="h-3 w-3 mr-1.5" />;
    case 'approved':
      return <CheckCircle2 className="h-3 w-3 mr-1.5" />;
    case 'returned':
      return <XCircle className="h-3 w-3 mr-1.5" />;
    default:
      return <FileText className="h-3 w-3 mr-1.5" />;
  }
};

// Helper function to shorten status text
const shortenStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under_review_dept_head': 'Dept Head',
    'under_review_dean': 'Dean',
    'under_review_citl': 'CITL',
    'under_review_vpaa': 'VPAA',
    'approved': 'Approved',
    'returned': 'Returned',
  };
  return statusMap[status] || STATUS_LABELS[status as SyllabusStatus] || status;
};

export default function AllSyllabiPage() {
  const navigate = useNavigate();
  const { syllabi } = useData();
  const { toast } = useToast();
  
  // Refs for scrolling management
  const tableRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  type SortState = 'desc' | 'asc' | null;
  const [sortState, setSortState] = useState<SortState>(null);

  const availableDepartments = useMemo(() => {
    return selectedCollege === 'all' ? [] : DEPARTMENTS[selectedCollege] || [];
  }, [selectedCollege]);

  const filteredSyllabi = useMemo(() => {
    return syllabi.filter(syllabus => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        syllabus.courseCode.toLowerCase().includes(query) ||
        syllabus.courseTitle.toLowerCase().includes(query) ||
        syllabus.facultyName.toLowerCase().includes(query);
      
      return matchesSearch &&
        (selectedCollege === 'all' || syllabus.college === selectedCollege) &&
        (selectedDepartment === 'all' || syllabus.department === selectedDepartment) &&
        (selectedStatus === 'all' || syllabus.status === selectedStatus) &&
        (selectedSemester === 'all' || syllabus.semesterPeriod === selectedSemester);
    });
  }, [syllabi, searchQuery, selectedCollege, selectedDepartment, selectedStatus, selectedSemester]);

  const sortedSyllabi = useMemo(() => {
    if (!sortState) return filteredSyllabi;
    
    return [...filteredSyllabi].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      
      // 1st click: Arrow Up = recent to old (descending)
      // 2nd click: Arrow down = old to recent (ascending)
      // 3rd click: default (null) = no sorting
      return sortState === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredSyllabi, sortState]);

  const totalPages = Math.ceil(sortedSyllabi.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSyllabi.slice(start, start + itemsPerPage);
  }, [sortedSyllabi, currentPage]);

  // Store scroll position before page change
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleSortToggle = () => {
    setSortState(current => {
      // Cycle through: null -> desc (arrow up) -> asc (arrow down) -> null
      if (current === null) return 'desc';
      if (current === 'desc') return 'asc';
      return null;
    });
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    const data = filteredSyllabi.map(s => ({
      'Course Code': s.courseCode,
      'Course Title': s.courseTitle,
      'Faculty': s.facultyName,
      'College': s.college,
      'Department': s.department,
      'Semester': s.semesterPeriod,
      'Status': STATUS_LABELS[s.status],
      'Last Updated': s.updatedAt,
    }));

    if (type === 'csv') {
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syllabi_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Export successful",
      description: `Exported ${filteredSyllabi.length} syllabi as ${type.toUpperCase()}.`,
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCollege('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setSelectedSemester('all');
    setCurrentPage(1);
    setSortState(null);
  };

  const hasActiveFilters = searchQuery || selectedCollege !== 'all' || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedSemester !== 'all';

  const shortenText = (text: string, max: number = 18) => {
    if (!text || text === '-') return '-';
    if (text.length <= max) return text;
    return text.substring(0, max - 3) + '...';
  };

  // Store scroll position before page change
  const handlePageChange = (page: number) => {
    // Save current scroll position relative to pagination
    if (paginationRef.current) {
      const rect = paginationRef.current.getBoundingClientRect();
      setScrollPosition(rect.top);
    }
    setCurrentPage(page);
  };

  // Restore scroll position after page change
  useEffect(() => {
    if (scrollPosition !== 0 && paginationRef.current) {
      const scrollToPosition = scrollPosition + window.scrollY;
      window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
      });
    }
  }, [currentPage, scrollPosition]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCollege, selectedDepartment, selectedStatus, selectedSemester]);

  // Helper function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text || text === '-') return '-';
    if (text.length <= maxLength) return text;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = text.lastIndexOf(' ', maxLength - 3);
    const cutPoint = lastSpace > maxLength - 10 ? lastSpace : maxLength - 3;
    
    return text.substring(0, cutPoint) + '...';
  };

  // Helper function to shorten college/department names
  const shortenCollegeDepartment = (text: string, maxLength: number = 18) => {
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

  // Mobile Card Component - Fixed alignment
  const SyllabusCard = ({ syllabus }: { syllabus: any }) => (
    <Card key={syllabus.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Top section with course info and status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-foreground">{syllabus.courseCode}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{syllabus.courseTitle}</p>
            <div className="text-sm font-medium flex items-center">
              <User className="h-3 w-3 mr-1.5 text-muted-foreground" />
              {syllabus.facultyName}
            </div>
          </div>
          <Badge 
            variant={getStatusVariant(syllabus.status)}
            className="inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-semibold flex-shrink-0 ml-2"
            title={STATUS_LABELS[syllabus.status]}
          >
            {getStatusIcon(syllabus.status)}
            {shortenStatus(syllabus.status)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3 mt-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">College</p>
            <p className="text-sm truncate" title={syllabus.college}>
              {shortenCollegeDepartment(syllabus.college, 20)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Department</p>
            <p className="text-sm truncate" title={syllabus.department}>
              {shortenCollegeDepartment(syllabus.department, 20)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Semester</p>
            <Badge variant="secondary" className="inline-flex items-center text-xs">
              <Calendar className="h-3 w-3 mr-1.5" />
              {syllabus.semesterPeriod}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Updated</p>
            <p className="text-sm flex items-center">
              <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
              {format(new Date(syllabus.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end pt-3 border-t">
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/syllabus/${syllabus.id}`)} 
            className="gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1 && sortedSyllabi.length === 0) return null;

    // Get the range of items being shown
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, sortedSyllabi.length);

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
      <div ref={paginationRef} className="border-t pt-4 mt-4">
        {/* Showing X-Y of Z syllabi */}
        <div className="text-sm text-muted-foreground mb-4 text-center">
          Showing <span className="font-medium text-foreground">{startIndex}-{endIndex}</span> of{' '}
          <span className="font-medium text-foreground">{sortedSyllabi.length}</span>{' '}
          syllabi
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
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
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
                    onClick={() => handlePageChange(page as number)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
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
          <h1 className="text-3xl font-bold text-foreground">All Syllabi</h1>
          <p className="text-muted-foreground">View and export all syllabi</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF (Mock)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="text-muted-foreground"
              >
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
                placeholder="Search course code, title, or faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* College filter */}
            <div className="relative">
              <Select value={selectedCollege} onValueChange={(value) => {
                setSelectedCollege(value);
                setSelectedDepartment('all');
              }}>
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue placeholder="College" />
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
                value={selectedDepartment} 
                onValueChange={setSelectedDepartment} 
                disabled={selectedCollege === 'all'}
              >
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue 
                        placeholder={selectedCollege === 'all' ? "Select college first" : "Department"}
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

            {/* Status filter - using shortened labels */}
            <div className="relative">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue placeholder="Status" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all" className="text-sm truncate">All Statuses</SelectItem>
                  {['draft', 'submitted', 'under_review_dept_head', 'under_review_dean', 'under_review_citl', 'under_review_vpaa', 'approved', 'returned'].map(status => (
                    <SelectItem key={status} value={status} className="text-sm truncate">
                      {shortenStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester filter */}
            <div className="relative">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="h-10 w-full min-w-0">
                  <div className="flex items-center w-full overflow-hidden">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      <SelectValue placeholder="Semester" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all" className="text-sm truncate">All Semesters</SelectItem>
                  {SEMESTERS.map(semester => (
                    <SelectItem key={semester} value={semester} className="text-sm truncate">
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Syllabi Results
            </CardTitle>
            {hasActiveFilters && filteredSyllabi.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredSyllabi.length} result{filteredSyllabi.length !== 1 ? 's' : ''} found
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedSyllabi.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No syllabi found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters ? "No syllabi match your filters." : "No syllabi in system."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-3">
                {currentItems.map((syllabus) => (
                  <SyllabusCard key={syllabus.id} syllabus={syllabus} />
                ))}
              </div>
              
              {/* Desktop Table View - Optimized for no horizontal scroll */}
              <div className="hidden lg:block">
                <div ref={tableRef} className="rounded-md border overflow-hidden">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold py-2 px-3 w-[80px] min-w-[80px]">Code</TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[140px] min-w-[140px]">Course Title</TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[90px] min-w-[90px]">Faculty</TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[80px] min-w-[80px]">College</TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[90px] min-w-[90px]">Department</TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[100px] min-w-[100px]">Status</TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[80px] min-w-[80px]">
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:text-foreground" 
                            onClick={handleSortToggle}
                          >
                            Updated
                            <div className="flex flex-col">
                              <ChevronUp 
                                className={`h-4 w-4 -mb-1 ${
                                  sortState === 'desc' 
                                    ? 'text-yellow-500' 
                                    : 'text-muted-foreground'
                                }`} 
                              />
                              <ChevronDown 
                                className={`h-4 w-4 -mt-1 ${
                                  sortState === 'asc' 
                                    ? 'text-yellow-500' 
                                    : 'text-muted-foreground'
                                }`} 
                              />
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold py-2 px-3 w-[50px] min-w-[50px] text-center">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((syllabus) => (
                        <TableRow key={syllabus.id} className="border-b hover:bg-muted/50 transition-colors">
                          <TableCell className="py-2 px-3">
                            <div className="font-medium text-sm">
                              {syllabus.courseCode}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="text-sm truncate max-w-[140px]" title={syllabus.courseTitle}>
                              {truncateText(syllabus.courseTitle, 25)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="text-sm text-muted-foreground truncate max-w-[90px] flex items-center" title={syllabus.facultyName}>
                              <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              {shortenText(syllabus.facultyName, 18)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="text-sm truncate max-w-[80px]" title={syllabus.college}>
                              {shortenCollegeDepartment(syllabus.college, 15)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="text-sm truncate max-w-[90px]" title={syllabus.department}>
                              {shortenCollegeDepartment(syllabus.department, 18)}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <Badge 
                              variant={getStatusVariant(syllabus.status)}
                              className="inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-semibold"
                              title={STATUS_LABELS[syllabus.status]}
                            >
                              {getStatusIcon(syllabus.status)}
                              {shortenStatus(syllabus.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="text-sm text-muted-foreground whitespace-nowrap flex items-center">
                              <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              {format(new Date(syllabus.updatedAt), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/syllabus/${syllabus.id}`)}
                              className="h-7 w-7 p-0"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Pagination />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}