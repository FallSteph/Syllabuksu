import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, CheckCircle, Link as LinkIcon, X, Copy, AlertTriangle, Sparkles, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { semesterStorage } from '@/utils/semesterStorage';

// Mock AI analysis results - In real app, this would come from API
const mockAIAnalysis = (fileName: string) => ({
  id: Date.now().toString(),
  fileName,
  timestamp: new Date().toISOString(),
  overallScore: 78,
  status: 'needs_improvement' as const,
  suggestions: [
    {
      id: 1,
      category: 'Structure',
      severity: 'medium',
      title: 'Missing Learning Outcomes',
      description: 'No clearly defined Course Learning Outcomes section.',
      recommendation: 'Add CLOs with measurable verbs.'
    },
    {
      id: 2,
      category: 'Assessment',
      severity: 'high',
      title: 'Grading Scheme Issue',
      description: 'Grading percentages sum to 95%, not 100%.',
      recommendation: 'Adjust distribution to total 100%.'
    },
    {
      id: 3,
      category: 'Alignment',
      severity: 'low',
      title: 'CO-PO Mapping Incomplete',
      description: '3 out of 5 Course Outcomes mapped.',
      recommendation: 'Complete CO-PO matrix.'
    }
  ],
  missingSections: [
    'Academic Integrity Policy',
    'Disability Accommodation',
    'Course Schedule'
  ],
  alignmentScore: {
    coSlo: 65,
    assessment: 82,
    content: 74
  }
});

export default function UploadSyllabusPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addSyllabus } = useData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [semesters, setSemesters] = useState<{id: string, name: string, code: string, isCurrent: boolean}[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  
  const [formLinks, setFormLinks] = useState({
    form17: '',
    form18: '',
  });
  
  const [formData, setFormData] = useState({
    courseCode: '',
    courseTitle: '',
    semesterPeriod: '',
    syllabusFile: null as File | null,
  });

  useEffect(() => {
    // Load semesters on component mount
    const activeSemesters = semesterStorage.getActiveSemesters();
    const formattedSemesters = activeSemesters.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      isCurrent: s.isCurrent
    }));
    
    setSemesters(formattedSemesters);
    
    // Auto-select current semester if available
    const currentSemester = semesterStorage.getCurrentSemester();
    if (currentSemester && !formData.semesterPeriod) {
      setFormData(prev => ({
        ...prev,
        semesterPeriod: currentSemester.id
      }));
    }
    
    setLoadingSemesters(false);
  }, []);

  const handleLinkChange = (formType: 'form17' | 'form18', value: string) => {
    setFormLinks(prev => ({
      ...prev,
      [formType]: value
    }));
  };

  const removeLink = (formType: 'form17' | 'form18') => {
    setFormLinks(prev => ({
      ...prev,
      [formType]: ''
    }));
  };

  const validateGoogleDocsLink = (url: string): boolean => {
    if (!url.trim()) return true;
    
    const googleDocsPatterns = [
      /^https?:\/\/(docs\.google\.com\/document\/d\/[^\/]+\/.*)$/i,
      /^https?:\/\/(drive\.google\.com\/file\/d\/[^\/]+\/.*)$/i,
      /^https?:\/\/(drive\.google\.com\/open\?id=.*)$/i,
    ];
    
    return googleDocsPatterns.some(pattern => pattern.test(url.trim()));
  };

  // Simulate AI analysis
  const analyzeSyllabus = async (file: File) => {
    setIsAnalyzing(true);
    
    // Simulate API call to AI service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = mockAIAnalysis(file.name);
    setAiResults(results);
    setIsAnalyzing(false);
    setShowAIModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({...formData, syllabusFile: file});
      
      // Automatically trigger AI analysis
      analyzeSyllabus(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.syllabusFile) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required fields and upload syllabus',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.semesterPeriod) {
      toast({
        title: 'Missing Semester',
        description: 'Please select a semester',
        variant: 'destructive',
      });
      return;
    }

    // Validate Google Docs links
    if (formLinks.form17.trim() && !validateGoogleDocsLink(formLinks.form17)) {
      toast({
        title: 'Invalid Form 17 Link',
        description: 'Please provide a valid Google Docs link',
        variant: 'destructive',
      });
      return;
    }

    if (formLinks.form18.trim() && !validateGoogleDocsLink(formLinks.form18)) {
      toast({
        title: 'Invalid Form 18 Link',
        description: 'Please provide a valid Google Docs link',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get selected semester info
    const selectedSemester = semesterStorage.getSemesters().find(s => s.id === formData.semesterPeriod);
    const semesterName = selectedSemester ? `${selectedSemester.name} (${selectedSemester.code})` : formData.semesterPeriod;

    addSyllabus({
      courseCode: formData.courseCode,
      courseTitle: formData.courseTitle,
      semesterPeriod: semesterName,
      college: user.college,
      department: user.department,
      facultyId: user.id,
      facultyName: `${user.firstName} ${user.lastName}`,
      fileName: formData.syllabusFile.name,
      form17Link: formLinks.form17.trim() || undefined,
      form18Link: formLinks.form18.trim() || undefined,
      status: 'under_review_dept_head' as const,
      aiAnalysis: aiResults ? {
        score: aiResults.overallScore,
        suggestions: aiResults.suggestions,
        appliedSuggestions: false
      } : undefined,
    });

    toast({
      title: 'Syllabus Uploaded Successfully!',
      description: 'Your syllabus has been submitted for review.',
    });

    setIsLoading(false);
    setShowAIModal(false);
    navigate('/faculty/track');
  };

  const copyResultsToClipboard = () => {
    if (!aiResults) return;
    
    const text = `AI Analysis Results for ${formData.syllabusFile?.name}
Overall Score: ${aiResults.overallScore}/100
Status: ${aiResults.status}

Key Suggestions:
${aiResults.suggestions.map((s: any) => `- [${s.severity.toUpperCase()}] ${s.title}: ${s.description}`).join('\n')}

Missing Sections:
${aiResults.missingSections.map((s: string) => `- ${s}`).join('\n')}

Alignment Scores:
CO-SLO: ${aiResults.alignmentScore.coSlo}%
Assessment: ${aiResults.alignmentScore.assessment}%
Content: ${aiResults.alignmentScore.content}%`;

    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'AI analysis results have been copied.',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const uploadAnyway = () => {
    setShowAIModal(false);
    // Programmatically trigger form submission
    const form = document.querySelector('form');
    if (form) {
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.click();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Simplified Header - Removed AI icon */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Syllabus</h1>
        <p className="text-muted-foreground mt-1">
          Submit a new syllabus with AI-powered quality analysis
        </p>
      </div>

      {/* AI Analysis Modal - Fixed Version */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Analysis Results
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Review suggestions before submitting
                </DialogDescription>
              </div>
              
              {/* Copy button - Using flex instead of absolute positioning */}
              <div className="ml-4">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyResultsToClipboard}
                        className="h-8 w-8 p-0 hover:bg-accent"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy analysis</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="left"
                      className="z-50"
                    >
                      <p className="text-xs">Copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </DialogHeader>

          {aiResults && (
            <div className="flex-1 overflow-y-auto px-6">
              {/* Compact Score Cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(aiResults.overallScore)}`}>
                    {aiResults.overallScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Score</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(aiResults.alignmentScore.coSlo)}`}>
                    {aiResults.alignmentScore.coSlo}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">CO-SLO</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Badge 
                    variant="outline" 
                    className={`
                      ${aiResults.status === 'excellent' ? 'bg-success/20 text-success border-success/30' :
                        aiResults.status === 'good' ? 'bg-warning/20 text-warning border-warning/30' : 
                        'bg-destructive/20 text-destructive border-destructive/30'}
                      text-xs px-2 py-0.5
                    `}
                  >
                    {aiResults.status.replace('_', ' ')}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-2">Status</div>
                </div>
              </div>

              {/* Compact Tabs */}
              <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="grid grid-cols-3 mb-3">
                  <TabsTrigger value="suggestions" className="text-xs py-1.5">
                    Suggestions ({aiResults.suggestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="alignment" className="text-xs py-1.5">
                    Alignment
                  </TabsTrigger>
                  <TabsTrigger value="missing" className="text-xs py-1.5">
                    Missing ({aiResults.missingSections.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="suggestions" className="space-y-3 mt-0">
                  {aiResults.suggestions.map((suggestion: any) => (
                    <div key={suggestion.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSeverityColor(suggestion.severity)}`}
                            >
                              {suggestion.severity}
                            </Badge>
                            <span className="font-medium text-sm truncate">{suggestion.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                          <p className="text-xs">
                            <span className="font-medium">Recommendation:</span> {suggestion.recommendation}
                          </p>
                        </div>
                        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          suggestion.severity === 'high' ? 'text-destructive' :
                          suggestion.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                        }`} />
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="alignment" className="space-y-3 mt-0">
                  {['coSlo', 'assessment', 'content'].map((key, index) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {key === 'coSlo' ? 'CO-SLO Alignment' :
                           key === 'assessment' ? 'Assessment Alignment' : 'Content Coverage'}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(aiResults.alignmentScore[key])}`}>
                          {aiResults.alignmentScore[key]}%
                        </span>
                      </div>
                      <Progress 
                        value={aiResults.alignmentScore[key]} 
                        className="h-1.5" 
                      />
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="missing" className="space-y-2 mt-0">
                  {aiResults.missingSections.map((section: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm p-2 border rounded-lg">
                      <X className="h-3 w-3 text-destructive flex-shrink-0" />
                      <span>{section}</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Fixed Action Buttons - Copy | Cancel | Upload Anyway */}
          <DialogFooter className="flex items-center justify-between gap-2 p-4 border-t bg-muted/20">
            {/* Left side - Copy button moved to header, so this is empty */}
            <div className="flex-1"></div>
            
            {/* Right side - Cancel and Upload Anyway buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAIModal(false)}
                className="min-w-[100px]"
                size="sm"
              >
                Cancel
              </Button>
              
              <Button
                onClick={uploadAnyway}
                className="min-w-[100px]"
                size="sm"
              >
                Upload Anyway
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Form */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="courseCode">Course Code *</Label>
                <Input 
                  id="courseCode"
                  placeholder="CS101" 
                  value={formData.courseCode} 
                  onChange={(e) => setFormData({...formData, courseCode: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseTitle">Course Title *</Label>
                <Input 
                  id="courseTitle"
                  placeholder="Introduction to Computer Science" 
                  value={formData.courseTitle} 
                  onChange={(e) => setFormData({...formData, courseTitle: e.target.value})} 
                  required 
                />
              </div>
            </div>

            {/* Semester Period */}
            <div className="space-y-2">
              <Label htmlFor="semester">Semester Period *</Label>
              <Select 
                value={formData.semesterPeriod} 
                onValueChange={(v) => setFormData({...formData, semesterPeriod: v})}
                required
                disabled={loadingSemesters}
              >
                <SelectTrigger id="semester">
                  {loadingSemesters ? (
                    <span className="text-muted-foreground">Loading semesters...</span>
                  ) : (
                    <SelectValue placeholder="Select semester" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {semesters.map(semester => (
                    <SelectItem key={semester.id} value={semester.id}>
                      <div className="flex items-center justify-between">
                        <span>{semester.name} ({semester.code})</span>
                        {semester.isCurrent && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* College and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>College</Label>
                <Input value={user?.college || 'N/A'} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={user?.department || 'N/A'} disabled className="bg-muted" />
              </div>
            </div>

            {/* Syllabus Upload with AI Analysis */}
            <div className="space-y-2">
              <Label htmlFor="syllabusFile">Upload Syllabus (PDF/DOCX) *</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors relative">
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="font-medium">Analyzing Syllabus</p>
                      <p className="text-sm text-muted-foreground">
                        AI is checking for improvements...
                      </p>
                    </div>
                  </div>
                )}
                
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <Input 
                  id="syllabusFile"
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf,.docx,.doc" 
                  className="max-w-xs mx-auto" 
                  onChange={handleFileChange}
                  required 
                />
                <p className="text-sm text-muted-foreground mt-2">
                  PDF or DOCX (Max: 10MB)
                </p>
                {formData.syllabusFile && !isAnalyzing && (
                  <div className="mt-4 p-3 bg-success/10 rounded-lg inline-flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium truncate max-w-xs">
                      {formData.syllabusFile.name}
                    </span>
                    {aiResults && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* AI Analysis Indicator */}
                {formData.syllabusFile && aiResults && !isAnalyzing && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIModal(true)}
                      className="gap-2"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View AI Analysis
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI will analyze your syllabus for improvements</span>
              </div>
            </div>

            {/* Form 17 and Form 18 Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="form17" className="flex items-center gap-2">
                  Form 17 Link (Optional)
                  {formLinks.form17 && <CheckCircle className="h-3 w-3 text-success" />}
                </Label>
                <div className="relative">
                  <Input 
                    id="form17"
                    type="url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={formLinks.form17}
                    onChange={(e) => handleLinkChange('form17', e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {formLinks.form17 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink('form17')}
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Google Docs link only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form18" className="flex items-center gap-2">
                  Form 18 Link (Optional)
                  {formLinks.form18 && <CheckCircle className="h-3 w-3 text-success" />}
                </Label>
                <div className="relative">
                  <Input 
                    id="form18"
                    type="url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={formLinks.form18}
                    onChange={(e) => handleLinkChange('form18', e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {formLinks.form18 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink('form18')}
                        className="h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Google Docs link only
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={isLoading || isAnalyzing}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Syllabus
                </>
              )}
            </Button>

            {/* Help Text - Reverted to Important Notes */}
            <div className="text-sm text-muted-foreground pt-4 border-t">
              <p className="font-medium mb-2">Important Notes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All fields marked with * are required</li>
                <li>Syllabus must be uploaded as PDF or DOCX file</li>
                <li>Form 17 and Form 18 links are optional</li>
                <li>If provided, links must be Google Docs or Google Drive links</li>
                <li>Ensure sharing permissions are set to "Anyone with the link can edit"</li>
                <li>You can track the status of your submission in the Track page</li>
                <li>AI analysis provides suggestions for improvement but doesn't block submission</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}