import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, Forward, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types';
import { format } from 'date-fns';

export default function ReviewerHistoryPage() {
  const navigate = useNavigate();
  const { syllabi } = useData();
  const { user } = useAuth();

  if (!user) return null;

  // Get syllabi that this reviewer has reviewed
  const reviewedSyllabi = syllabi.filter(s => 
    s.reviewHistory.some(r => r.reviewerRole === user.role)
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'returned':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'forwarded':
        return <Forward className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'approved':
        return 'default';
      case 'returned':
        return 'destructive';
      case 'forwarded':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Review History</h1>
        <p className="text-muted-foreground mt-1">Syllabi you've reviewed</p>
      </div>

      {reviewedSyllabi.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Review History</h3>
            <p className="text-muted-foreground">You haven't reviewed any syllabi yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviewedSyllabi.map((syllabus) => {
            const myReview = syllabus.reviewHistory.find(r => r.reviewerRole === user.role);
            
            return (
              <Card 
                key={syllabus.id} 
                className="shadow-soft hover-lift cursor-pointer"
                onClick={() => navigate(`/syllabus/${syllabus.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{syllabus.courseCode} - {syllabus.courseTitle}</h3>
                        <p className="text-sm text-muted-foreground">{syllabus.department} • {syllabus.semesterPeriod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {myReview && (
                        <Badge variant={getActionBadgeVariant(myReview.action)} className="capitalize">
                          {getActionIcon(myReview.action)}
                          <span className="ml-1">{myReview.action}</span>
                        </Badge>
                      )}
                      <StatusBadge status={syllabus.status} size="sm" />
                    </div>
                  </div>

                  {myReview && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Reviewed on {format(new Date(myReview.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
