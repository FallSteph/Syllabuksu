import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileBarChart, 
  Users,
  X,
  Maximize2,
  Minimize2,
  FileType,
  Loader2,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';

export default function SyllabusViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { syllabi } = useData();
  
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  const [currentFileType, setCurrentFileType] = useState<'pdf' | 'docx'>('pdf');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDocumentType, setCurrentDocumentType] = useState<'syllabus' | 'form17' | 'form18'>('syllabus');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // For forcing iframe re-render

  const syllabus = syllabi.find(s => s.id === id);

  // Helper to determine file type from filename
  const getFileType = (fileName: string): 'pdf' | 'docx' => {
    if (!fileName) return 'pdf'; // default
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'docx' ? 'docx' : 'pdf';
  };

  // Use local sample files from public folder
  const getSampleFileUrl = (fileType: 'pdf' | 'docx'): string => {
    if (fileType === 'docx') {
      // Use local sample DOCX file
      return '/sample-files/sample.docx';
    } else {
      // Use local sample PDF file
      return '/sample-files/sample.pdf';
    }
  };

  // Get external link for Form 17 or Form 18
  const getExternalLink = (documentType: 'form17' | 'form18'): string => {
    if (!syllabus) return '';
    
    if (documentType === 'form17' && syllabus.form17Link) {
      return syllabus.form17Link;
    } else if (documentType === 'form18' && syllabus.form18Link) {
      return syllabus.form18Link;
    }
    return '';
  };

  const handleViewDocument = async (documentType: 'syllabus' | 'form17' | 'form18') => {
    const documentInfo = {
      syllabus: {
        name: 'Syllabus',
        available: !!syllabus?.fileName,
        fileType: syllabus?.fileName ? getFileType(syllabus.fileName) : 'pdf' as const
      },
      form17: {
        name: 'Form 17',
        available: !!syllabus?.form17Link,
        fileType: 'pdf' as const
      },
      form18: {
        name: 'Form 18',
        available: !!syllabus?.form18Link,
        fileType: 'pdf' as const
      }
    };

    const doc = documentInfo[documentType];
    
    if (!doc.available) {
      alert(`${doc.name} has not been uploaded yet.`);
      return;
    }

    setIsLoading(true);
    setCurrentDocumentType(documentType);
    
    try {
      if (documentType === 'syllabus') {
        // Use local sample file for syllabus
        const sampleUrl = getSampleFileUrl(doc.fileType);
        setCurrentFileUrl(sampleUrl);
        setCurrentFileType(doc.fileType);
        setIsFileModalOpen(true);
      } else {
        // For Form 17/18, use the external link from faculty
        const externalLink = getExternalLink(documentType);
        if (externalLink) {
          setCurrentFileUrl(externalLink);
          setCurrentFileType('pdf');
          setIsFileModalOpen(true);
        }
      }
      // Force iframe refresh
      setIframeKey(prev => prev + 1);
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document. Please try again.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleOpenExternalLink = (documentType: 'form17' | 'form18') => {
    const externalLink = getExternalLink(documentType);
    if (externalLink) {
      window.open(externalLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (!syllabus) return;
    
    const fileType = getFileType(syllabus.fileName);
    const fileUrl = getSampleFileUrl(fileType);
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `syllabus_${syllabus.courseCode}.${fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`Downloading: syllabus_${syllabus.courseCode}.${fileType}`);
  };

  const handlePrint = () => {
    if (!syllabus) return;
    
    if (syllabus.status !== 'approved') {
      alert('Only approved syllabi can be printed.');
      return;
    }
    
    const fileType = getFileType(syllabus.fileName);
    
    if (fileType === 'pdf') {
      const sampleUrl = getSampleFileUrl('pdf');
      const printWindow = window.open(sampleUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      alert('DOCX files need to be converted to PDF for printing. Please download first.');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(currentFileUrl, '_blank', 'noopener,noreferrer');
  };

  // File Viewer Modal Component
  const FileViewerModal = () => {
    if (!syllabus) return null;
    
    const getDocumentTitle = () => {
      switch (currentDocumentType) {
        case 'syllabus':
          return 'Syllabus';
        case 'form17':
          return 'Form 17';
        case 'form18':
          return 'Form 18';
        default:
          return 'Document';
      }
    };

    const getFileName = () => {
      if (currentDocumentType === 'syllabus') {
        return syllabus.fileName || `syllabus_${syllabus.courseCode}.${currentFileType}`;
      } else {
        return `${currentDocumentType}_${syllabus.courseCode}.pdf`;
      }
    };

    const handleReloadIframe = () => {
      setIframeKey(prev => prev + 1);
    };

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'bg-background p-0' : 'bg-black/50 p-4'
      }`}>
        <div className={`relative flex flex-col bg-background shadow-xl ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh] rounded-lg'
        }`}>
          {/* Header - Compact */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                currentFileType === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {currentFileType === 'pdf' ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <FileType className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {getFileName()}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {syllabus.courseCode} - {getDocumentTitle()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewTab}
                className="h-7 w-7 p-0"
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-7 w-7 p-0"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFileModalOpen(false)}
                className="h-7 w-7 p-0"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* File Viewer */}
          <div className="flex-1 relative">
            {currentFileType === 'pdf' ? (
              <>
                <div className="absolute inset-0">
                  <iframe 
                    key={`pdf-iframe-${iframeKey}`}
                    src={`${currentFileUrl}#view=FitH&toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={`${syllabus.courseCode} ${getDocumentTitle()}`}
                    allow="fullscreen"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      alert('Failed to load PDF. You can try opening the link directly instead.');
                    }}
                  />
                </div>
                
                {isLoading && (
                  <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground">Loading document...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="text-center max-w-2xl w-full">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                    <FileType className="h-10 w-10 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Word Document (.docx)</h4>
                  <p className="text-muted-foreground mb-6 text-base">
                    Word documents cannot be previewed directly in the browser. 
                    Please download the file to view it in Microsoft Word, Google Docs, or other compatible software.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = currentFileUrl;
                        link.download = getFileName();
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="gap-2 h-10 px-5"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                      Download DOCX File
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setCurrentFileType('pdf');
                        setCurrentFileUrl(getSampleFileUrl('pdf'));
                        handleReloadIframe();
                      }}
                      className="h-10 px-5"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Sample PDF Instead
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-6">
                    <strong>Note:</strong> This is a sample file for demonstration purposes.
                    In a real application, this would be the actual uploaded document.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Compact with only reload button */}
          <div className="border-t">
            <div className="p-2 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadIframe}
                className="h-7 px-2 text-xs"
              >
                <span className="mr-1">⟳</span>
                Reload
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!syllabus) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Syllabus Not Found</h3>
            <p className="text-muted-foreground">The syllabus you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine actual file type for badges
  const syllabusFileType = getFileType(syllabus.fileName);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section - Responsive */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="h-10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Syllabus Details</h1>
            <p className="text-sm md:text-base text-muted-foreground">{syllabus.courseCode} - {syllabus.courseTitle}</p>
          </div>
        </div>
        
        {/* Document Buttons - Separate buttons (not merged) */}
        <div className="flex items-center gap-3">
          {/* Syllabus Button */}
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleViewDocument('syllabus')}
            className="gap-2 h-9 px-4"
            disabled={isLoading}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm">View Syllabus</span>
            {isLoading && currentDocumentType === 'syllabus' && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
          </Button>
          
          {/* Form 17 Button - Opens external link in new tab */}
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              if (syllabus.form17Link) {
                handleOpenExternalLink('form17');
                setCurrentDocumentType('form17');
              } else {
                alert('Form 17 has not been uploaded yet.');
              }
            }}
            className="gap-2 h-9 px-4"
            disabled={!syllabus.form17Link || isLoading}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="text-sm">Form 17</span>
          </Button>
          
          {/* Form 18 Button - Opens external link in new tab */}
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              if (syllabus.form18Link) {
                handleOpenExternalLink('form18');
                setCurrentDocumentType('form18');
              } else {
                alert('Form 18 has not been uploaded yet.');
              }
            }}
            className="gap-2 h-9 px-4"
            disabled={!syllabus.form18Link || isLoading}
          >
            <FileBarChart className="h-4 w-4" />
            <span className="text-sm">Form 18</span>
          </Button>
        </div>
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center ${
                    syllabusFileType === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {syllabusFileType === 'pdf' ? (
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    ) : (
                      <FileType className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">{syllabus.courseTitle}</CardTitle>
                    <CardDescription>Course Code: {syllabus.courseCode}</CardDescription>
                  </div>
                </div>
                <StatusBadge status={syllabus.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium text-foreground">{syllabus.semesterPeriod}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">File Info</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {syllabus.fileName}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Faculty Information */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Faculty</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">{syllabus.facultyName || 'Not specified'}</p>
                </div>
              </div>

              {/* College and Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">{syllabus.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">College</p>
                  <p className="font-medium text-foreground">{syllabus.college}</p>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Documents Available</p>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`gap-1 ${syllabusFileType === 'pdf' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}
                  >
                    {syllabusFileType === 'pdf' ? (
                      <FileText className="h-3 w-3" />
                    ) : (
                      <FileType className="h-3 w-3" />
                    )}
                    Syllabus ({syllabusFileType.toUpperCase()})
                  </Badge>
                  
                  {syllabus.form17Link ? (
                    <Badge variant="secondary" className="gap-1">
                      <FileSpreadsheet className="h-3 w-3" />
                      Form 17
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Form 17 (Not uploaded)
                    </Badge>
                  )}
                  
                  {syllabus.form18Link ? (
                    <Badge variant="secondary" className="gap-1">
                      <FileBarChart className="h-3 w-3" />
                      Form 18
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Form 18 (Not uploaded)
                    </Badge>
                  )}
                </div>
              </div>

              {syllabus.feedback && (
                <>
                  <Separator />
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <p className="font-medium text-foreground mb-1">Reviewer Feedback</p>
                    <p className="text-sm text-muted-foreground">{syllabus.feedback}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Review History */}
          {syllabus.reviewHistory.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Review History</CardTitle>
                <CardDescription>{syllabus.reviewHistory.length} review(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syllabus.reviewHistory.map((review, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        review.action === 'approved' || review.action === 'forwarded'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="font-medium text-foreground capitalize">{review.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.timestamp), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{review.reviewerRole.replace('_', ' ')}</p>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2 break-words">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Only Timeline Info remains */}
        <div className="space-y-6">
          {/* Timeline Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium text-foreground truncate">
                    {format(new Date(syllabus.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-medium text-foreground truncate">
                    {format(new Date(syllabus.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Viewer Modal */}
      {isFileModalOpen && <FileViewerModal />}
    </div>
  );
}