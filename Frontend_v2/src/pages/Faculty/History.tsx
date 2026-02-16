import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Download, Eye, Filter, Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';
import { STATUS_LABELS } from '@/types';

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
  return statusMap[status] || STATUS_LABELS[status as any] || status;
};

// Helper function to get badge variant
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

export default function FacultyHistoryPage() {
  const navigate = useNavigate();
  const { syllabi } = useData();

  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort state
  type SortState = 'desc' | 'asc' | null;
  const [sortState, setSortState] = useState<SortState>(null);

  // Refs for scrolling
  const paginationRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Get faculty's syllabi (mock: using faculty ID 2)
  const facultySyllabi = useMemo(() => {
    return syllabi.filter(s => s.facultyId === '2');
  }, [syllabi]);

  // Get unique semesters for filter
  const uniqueSemesters = useMemo(() => {
    const semesters = Array.from(new Set(facultySyllabi.map(s => s.semesterPeriod)));
    return semesters.sort();
  }, [facultySyllabi]);

  // Filter syllabi
  const filteredSyllabi = useMemo(() => {
    return facultySyllabi.filter(syllabus => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        syllabus.courseCode.toLowerCase().includes(query) ||
        syllabus.courseTitle.toLowerCase().includes(query) ||
        syllabus.fileName.toLowerCase().includes(query);
      
      return matchesSearch &&
        (selectedStatus === 'all' || syllabus.status === selectedStatus) &&
        (selectedSemester === 'all' || syllabus.semesterPeriod === selectedSemester);
    });
  }, [facultySyllabi, searchQuery, selectedStatus, selectedSemester]);

  // Sort syllabi
  const sortedSyllabi = useMemo(() => {
    if (!sortState) return filteredSyllabi;
    
    return [...filteredSyllabi].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      return sortState === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredSyllabi, sortState]);

  // Pagination
  const totalPages = Math.ceil(sortedSyllabi.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSyllabi.slice(start, start + itemsPerPage);
  }, [sortedSyllabi, currentPage]);

  // Helper functions
  const handleSortToggle = () => {
    setSortState(current => {
      if (current === null) return 'desc';
      if (current === 'desc') return 'asc';
      return null;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedSemester('all');
    setCurrentPage(1);
    setSortState(null);
  };

  const hasActiveFilters = searchQuery || selectedStatus !== 'all' || selectedSemester !== 'all';

  const handlePageChange = (page: number) => {
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedSemester]);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text || text === '-') return '-';
    if (text.length <= maxLength) return text;
    
    const lastSpace = text.lastIndexOf(' ', maxLength - 3);
    const cutPoint = lastSpace > maxLength - 10 ? lastSpace : maxLength - 3;
    
    return text.substring(0, cutPoint) + '...';
  };

  // Mobile Card Component
  const SyllabusCard = ({ syllabus }: { syllabus: any }) => (
    <Card key={syllabus.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Top section with course info and status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-foreground">{syllabus.courseCode}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{truncateText(syllabus.courseTitle, 40)}</p>
            <Badge variant="outline" className="font-mono text-xs mt-1">
              {truncateText(syllabus.fileName, 18)}
            </Badge>
          </div>
          <Badge 
            variant={getStatusVariant(syllabus.status)}
            className="inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-semibold flex-shrink-0 ml-2"
            title={STATUS_LABELS[syllabus.status]}
          >
            {shortenStatus(syllabus.status)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3 mt-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Semester</p>
            <Badge variant="secondary" className="inline-flex items-center text-xs">
              <Calendar className="h-3 w-3 mr-1.5" />
              {syllabus.semesterPeriod}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Upload Date</p>
            <p className="text-sm flex items-center">
              <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
              {format(new Date(syllabus.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end pt-3 border-t gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => navigate(`/syllabus/${syllabus.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {/* Mock download */}}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1 && sortedSyllabi.length === 0) return null;

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, sortedSyllabi.length);

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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
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
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Submission History</h1>
          <p className="text-muted-foreground">View your syllabus submission history</p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <FileText className="h-4 w-4 mr-1" />
          {facultySyllabi.length} Total Submissions
        </Badge>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search course code, title, or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Status filter */}
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
                  {uniqueSemesters.map(semester => (
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

      {/* Syllabi Table/Cards */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              My Syllabi
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
                {hasActiveFilters ? "No syllabi match your filters." : "No syllabi submitted yet."}
              </p>
              {!hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={() => navigate('/faculty/upload')}>
                  Upload Your First Syllabus
                </Button>
              )}
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
                <div className="overflow-hidden rounded-md border">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold py-3 px-4 w-[180px] min-w-[180px] max-w-[180px]">Course</TableHead>
                        <TableHead className="font-semibold py-3 px-4 w-[150px] min-w-[150px] max-w-[150px]">Filename</TableHead>
                        <TableHead className="font-semibold py-3 px-4 w-[120px] min-w-[120px] max-w-[120px]">Semester</TableHead>
                        <TableHead className="font-semibold py-3 px-4 w-[130px] min-w-[130px] max-w-[130px]">
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:text-foreground" 
                            onClick={handleSortToggle}
                          >
                            Upload Date
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
                        <TableHead className="font-semibold py-3 px-4 w-[100px] min-w-[100px] max-w-[100px]">Status</TableHead>
                        <TableHead className="font-semibold py-3 px-4 w-[80px] min-w-[80px] max-w-[80px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((syllabus) => (
                        <TableRow 
                          key={syllabus.id} 
                          className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/syllabus/${syllabus.id}`)}
                        >
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {syllabus.courseCode}
                              </div>
                              <div className="text-sm text-muted-foreground truncate" title={syllabus.courseTitle}>
                                {truncateText(syllabus.courseTitle, 35)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge variant="outline" className="font-mono text-xs truncate max-w-full" title={syllabus.fileName}>
                              {truncateText(syllabus.fileName, 20)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-muted-foreground text-sm">
                            {syllabus.semesterPeriod}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-muted-foreground text-sm">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {format(new Date(syllabus.createdAt), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <Badge 
                              variant={getStatusVariant(syllabus.status)}
                              className="inline-flex items-center whitespace-nowrap px-2 py-1 text-xs font-semibold"
                              title={STATUS_LABELS[syllabus.status]}
                            >
                              {shortenStatus(syllabus.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/syllabus/${syllabus.id}`);
                                }}
                                className="h-7 w-7 p-0"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Mock download
                                }}
                                className="h-7 w-7 p-0"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
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