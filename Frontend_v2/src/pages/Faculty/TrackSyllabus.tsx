import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/StatusBadge';
import { useData } from '@/contexts/DataContext';
import { STATUS_LABELS, ROLE_LABELS } from '@/types';

const WORKFLOW_STEPS = [
  { status: 'under_review_dept_head', label: 'Department Head', role: 'dept_head' },
  { status: 'under_review_dean', label: 'Dean', role: 'dean' },
  { status: 'under_review_citl', label: 'CITL', role: 'citl' },
  { status: 'under_review_vpaa', label: 'VPAA', role: 'vpaa' },
  { status: 'approved', label: 'Approved', role: null },
];

export default function TrackSyllabusPage() {
  const navigate = useNavigate();
  const { syllabi } = useData();

  // Faculty's syllabi (mock: using faculty ID 2)
  const mySyllabi = syllabi.filter(s => s.facultyId === '2' && s.status !== 'approved' && s.status !== 'returned');

  const getCurrentStepIndex = (status: string) => {
    return WORKFLOW_STEPS.findIndex(step => step.status === status);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Track Syllabus</h1>
        <p className="text-muted-foreground mt-1">Monitor your syllabi through the approval workflow</p>
      </div>

      {mySyllabi.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No syllabi in progress</h3>
            <p className="text-muted-foreground mb-4">All your syllabi have been processed.</p>
            <Button onClick={() => navigate('/faculty/upload')}>Upload New Syllabus</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {mySyllabi.map((syllabus) => {
            const currentStepIndex = getCurrentStepIndex(syllabus.status);

            return (
              <Card key={syllabus.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{syllabus.courseCode} - {syllabus.courseTitle}</CardTitle>
                        <CardDescription>{syllabus.semesterPeriod}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/faculty/tracking/${syllabus.id}`)}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Workflow Steps Header */}
                  <div className="text-sm font-medium text-muted-foreground">
                    Approval Workflow
                  </div>

                  {/* Workflow Steps */}
                  <div className="relative">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                    <div className="relative flex justify-between">
                      {WORKFLOW_STEPS.map((step, index) => {
                        const isCompleted = index < currentStepIndex || syllabus.status === 'approved';
                        const isCurrent = index === currentStepIndex;

                        return (
                          <div key={step.status} className="flex flex-col items-center gap-2">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center z-10 transition-all ${
                                isCompleted
                                  ? 'bg-success text-white'
                                  : isCurrent
                                  ? 'bg-warning text-white animate-pulse'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : isCurrent ? (
                                <Clock className="h-5 w-5" />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-medium text-center max-w-[80px] ${
                                isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Status Info */}
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium text-foreground">
                          Under Review by {WORKFLOW_STEPS[currentStepIndex]?.label || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(syllabus.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}