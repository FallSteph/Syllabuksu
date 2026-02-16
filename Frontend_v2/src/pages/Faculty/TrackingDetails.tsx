import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle2, XCircle, User, MessageSquare, Eye, FileSpreadsheet, FileBarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useData } from '@/contexts/DataContext';
import { ROLE_LABELS } from '@/types';
import { format } from 'date-fns';

const WORKFLOW_STEPS = [
  { status: 'under_review_dept_head', label: 'Department Head', role: 'dept_head' },
  { status: 'under_review_dean', label: 'Dean', role: 'dean' },
  { status: 'under_review_citl', label: 'CITL', role: 'citl' },
  { status: 'under_review_vpaa', label: 'VPAA', role: 'vpaa' },
  { status: 'approved', label: 'Approved', role: null },
];

export default function TrackingIDPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { syllabi } = useData();

  const syllabus = syllabi.find(s => s.id === id);

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

  const getCurrentStepIndex = (status: string) => {
    return WORKFLOW_STEPS.findIndex(step => step.status === status);
  };

  const currentStepIndex = getCurrentStepIndex(syllabus.status);

  const handleViewDocument = (documentType: 'syllabus' | 'form17' | 'form18') => {
    const documentInfo = {
      syllabus: {
        url: syllabus.fileName || '#',
        name: 'Syllabus',
        available: !!syllabus.fileName
      },
      form17: {
        url: syllabus.form17Link || '#',
        name: 'Form 17',
        available: !!syllabus.form17Link
      },
      form18: {
        url: syllabus.form18Link || '#',
        name: 'Form 18',
        available: !!syllabus.form18Link
      }
    };

    const doc = documentInfo[documentType];
    
    if (!doc.available) {
      alert(`${doc.name} has not been uploaded yet.`);
      return;
    }

    if (documentType === 'syllabus') {
      alert(`Viewing syllabus file: ${syllabus.fileName}\n(Implement file viewing logic)`);
    } else {
      window.open(doc.url, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tracking Details</h1>
            <p className="text-muted-foreground">Syllabus ID: {syllabus.id}</p>
          </div>
        </div>
        
        {/* Document View Buttons - Hide unavailable forms */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewDocument('syllabus')}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Syllabus
          </Button>
          
          {/* Only show Form 17 button if form17Link exists */}
          {syllabus.form17Link && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewDocument('form17')}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Form 17
            </Button>
          )}
          
          {/* Only show Form 18 button if form18Link exists */}
          {syllabus.form18Link && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewDocument('form18')}
              className="gap-2"
            >
              <FileBarChart className="h-4 w-4" />
              Form 18
            </Button>
          )}
        </div>
      </div>

      {/* Syllabus Info Card - Simplified */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{syllabus.courseCode} - {syllabus.courseTitle}</CardTitle>
                <CardDescription>{syllabus.semesterPeriod}</CardDescription>
              </div>
            </div>
            <StatusBadge status={syllabus.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Audit Timeline */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Timeline
          </CardTitle>
          <CardDescription>Complete history of this syllabus workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {/* Submission Event */}
              <div className="relative flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center z-10">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 pb-6">
                  <p className="font-medium text-foreground">Syllabus Submitted</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(syllabus.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      File: {syllabus.fileName}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => handleViewDocument('syllabus')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                  {/* Removed faculty and department info - redundant for faculty viewing their own syllabus */}
                  {syllabus.aiAnalysis && (
                    <div className="mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs">
                      <p className="font-medium">AI Analysis Score: {syllabus.aiAnalysis.score}/100</p>
                      <p className="text-muted-foreground">
                        {syllabus.aiAnalysis.appliedSuggestions ? 'Suggestions applied' : 'Review suggestions'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {syllabus.reviewHistory?.map((review, index) => (
                <div key={index} className="relative flex gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center z-10 ${
                    review.action === 'approved' || review.action === 'forwarded'
                      ? 'bg-success text-white'
                      : 'bg-destructive text-white'
                  }`}>
                    {review.action === 'approved' || review.action === 'forwarded' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-medium text-foreground">
                      {review.action === 'forwarded' ? 'Forwarded' : review.action === 'approved' ? 'Approved' : 'Returned'} by {ROLE_LABELS[review.reviewerRole]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(review.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                    {review.comment && (
                      <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {syllabus.status !== 'approved' && syllabus.status !== 'returned' && (
                <div className="relative flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-warning text-white flex items-center justify-center z-10 animate-pulse">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      Under Review by {WORKFLOW_STEPS[currentStepIndex]?.label || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">Awaiting review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}