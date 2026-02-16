import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFReviewer, ReviewAction, Annotation, Signature } from '@/components/PDFReviewer';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { SyllabusStatus } from '@/types';

// Sample PDF URL for demo - in production this would come from the syllabus data
const SAMPLE_PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

export default function SyllabusReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { syllabi, updateSyllabusStatus, addReviewAction } = useData();

  const syllabus = syllabi.find(s => s.id === id);

  const getNextStatus = useCallback((actionType: ReviewAction['type']): SyllabusStatus => {
    if (!user) return 'submitted';
    if (actionType === 'return') return 'returned';
    if (actionType === 'approve') return 'approved';
    
    // Forward action
    switch (user.role) {
      case 'dept_head': return 'under_review_dean';
      case 'dean': return 'under_review_citl';
      case 'citl': return 'under_review_vpaa';
      case 'vpaa': return 'approved';
      default: return 'submitted';
    }
  }, [user]);

  const handleReviewSubmit = useCallback(async (data: {
    action: ReviewAction;
    comment: string;
    annotations: Annotation[];
    signature: Signature | null;
  }) => {
    if (!user || !syllabus) return;

    const { action, comment } = data;
    const nextStatus = getNextStatus(action.type);

    // Update syllabus status
    updateSyllabusStatus(
      syllabus.id, 
      nextStatus, 
      action.type === 'return' ? comment : undefined
    );

    // Add review action to history
    addReviewAction(syllabus.id, {
      reviewerId: user.id,
      reviewerName: `${user.firstName} ${user.lastName}`,
      reviewerRole: user.role,
      action: action.type === 'forward' ? 'forwarded' : action.type === 'approve' ? 'approved' : 'returned',
      comment: comment || undefined,
    });

    // Navigate back after successful submission
    setTimeout(() => {
      navigate(-1);
    }, 1500);

    return Promise.resolve();
  }, [syllabus, user, updateSyllabusStatus, addReviewAction, navigate, getNextStatus]);

  if (!user || !syllabus) {
    return (
      <div className="p-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="mt-6 shadow-soft">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Syllabus Not Found</h3>
            <p className="text-muted-foreground">
              The syllabus you're looking for doesn't exist or you don't have permission to review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Review: {syllabus.courseCode} - {syllabus.courseTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {syllabus.facultyName} • {syllabus.department}
            </p>
          </div>
        </div>
      </div>

      {/* PDF Reviewer */}
      <div className="flex-1 p-4 overflow-hidden">
        <PDFReviewer
          pdfUrl={SAMPLE_PDF_URL}
          syllabusId={syllabus.id}
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
          userRole={user.role}
          // Add Form 17/18 URLs from syllabus data
          form17Url={syllabus.form17Link}
          form18Url={syllabus.form18Link}
          onReviewSubmit={handleReviewSubmit}
          className="h-full"
        />
      </div>
    </div>
  );
}