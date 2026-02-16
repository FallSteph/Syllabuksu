import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Building,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { SyllabusStatus, Syllabus } from '@/types';

export default function ReviewSyllabiPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { syllabi } = useData();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!user) return null;

  const getReviewStatus = (): SyllabusStatus => {
    switch (user.role) {
      case 'dept_head':
        return 'under_review_dept_head';
      case 'dean':
        return 'under_review_dean';
      case 'citl':
        return 'under_review_citl';
      case 'vpaa':
        return 'under_review_vpaa';
      default:
        return 'submitted';
    }
  };

  const pendingSyllabi = syllabi.filter((s) => {
    if (s.status !== getReviewStatus()) return false;
    if (user.role === 'dept_head') return s.department === user.department;
    if (user.role === 'dean') return s.college === user.college;
    return true;
  });

  const toggleGroup = (groupId: string, open: boolean) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (open) {
        newSet.add(groupId);
      } else {
        newSet.delete(groupId);
      }
      return newSet;
    });
  };

  const groupSyllabi = () => {
    if (user.role === 'dean') {
      const groups: Record<string, Syllabus[]> = {};
      pendingSyllabi.forEach((s) => {
        const key = s.department || 'Other';
        groups[key] = groups[key] || [];
        groups[key].push(s);
      });
      return { type: 'department' as const, groups };
    }

    if (user.role === 'citl' || user.role === 'vpaa') {
      const groups: Record<string, Syllabus[]> = {};
      pendingSyllabi.forEach((s) => {
        const key = s.college || 'Other';
        groups[key] = groups[key] || [];
        groups[key].push(s);
      });
      return { type: 'college' as const, groups };
    }

    return { type: 'none' as const, groups: { All: pendingSyllabi } };
  };

  const groupedSyllabi = groupSyllabi();
  const groupEntries = Object.entries(groupedSyllabi.groups).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const renderSyllabusCard = (syllabus: Syllabus) => (
    <Card key={syllabus.id} className="shadow-soft mb-3 ml-2">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {syllabus.courseCode} – {syllabus.courseTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {syllabus.facultyName} • {syllabus.department}
                {groupedSyllabi.type === 'college' && ` • ${syllabus.college}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/syllabus/${syllabus.id}`)}
            >
              View Details
            </Button>
            <Button
              size="sm"
              onClick={() =>
                navigate(`/reviewer/syllabi/${syllabus.id}/review`)
              }
            >
              <FileText className="h-4 w-4 mr-1" />
              Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderGroupedContent = () => {
    if (pendingSyllabi.length === 0) {
      return (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold">All caught up!</h3>
            <p className="text-muted-foreground">
              No syllabi pending your review.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (groupedSyllabi.type === 'none') {
      return <div className="space-y-4">{pendingSyllabi.map(renderSyllabusCard)}</div>;
    }

    return (
      <div className="space-y-4">
        {groupEntries.map(([groupName, syllabiInGroup]) => {
          const groupId = `${groupedSyllabi.type}-${groupName}`;
          const isExpanded = expandedGroups.has(groupId);

          return (
            <Collapsible
              key={groupId}
              open={isExpanded}
              onOpenChange={(open) => toggleGroup(groupId, open)}
              className="border border-border rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button className="w-full text-left">
                  <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {groupedSyllabi.type === 'college' ? (
                          <Building className="h-5 w-5 text-primary" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{groupName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {syllabiInGroup.length} syllabus
                          {syllabiInGroup.length !== 1 ? 'i' : ''} pending review
                        </p>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-4 pt-2 space-y-2">
                  {syllabiInGroup.map(renderSyllabusCard)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Syllabi</h1>
        <p className="text-muted-foreground mt-1">
          Syllabi awaiting your review
          {groupedSyllabi.type !== 'none' && (
            <span className="ml-2 text-sm bg-primary/10 text-primary px-2 py-1 rounded">
              Grouped by {groupedSyllabi.type}
            </span>
          )}
        </p>
      </div>

      {renderGroupedContent()}
    </div>
  );
}
