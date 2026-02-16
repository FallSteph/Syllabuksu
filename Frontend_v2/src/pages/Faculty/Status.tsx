import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, MessageSquare, ArrowRight, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';

export default function StatusPage() {
  const navigate = useNavigate();
  const { syllabi } = useData();
  const [activeTab, setActiveTab] = useState('approved');

  // Faculty's completed syllabi (approved or returned)
  const mySyllabi = syllabi.filter(s => s.facultyId === '2');
  const approvedSyllabi = mySyllabi.filter(s => s.status === 'approved');
  const returnedSyllabi = mySyllabi.filter(s => s.status === 'returned');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Syllabus Status</h1>
        <p className="text-muted-foreground mt-1">View approved and returned syllabi</p>
      </div>

      <Tabs defaultValue="approved" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="approved" className="relative">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approved
            {approvedSyllabi.length > 0 && (
              <span className="ml-2 bg-success text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {approvedSyllabi.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="returned" className="relative">
            <XCircle className="h-4 w-4 mr-2" />
            Returned
            {returnedSyllabi.length > 0 && (
              <span className="ml-2 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {returnedSyllabi.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Approved Tab Content */}
        <TabsContent value="approved" className="space-y-6">
          <div className="flex items-center gap-3 mt-6">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Approved & Ready to Print</h2>
              <p className="text-sm text-muted-foreground">Syllabi that have completed all reviews</p>
            </div>
          </div>

          {approvedSyllabi.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No approved syllabi</h3>
                <p className="text-muted-foreground">Syllabi will appear here once they've been approved by all reviewers.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedSyllabi.map((syllabus) => (
                <Card key={syllabus.id} className="shadow-soft border-success/20 h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{syllabus.courseCode}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{syllabus.courseTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1">{syllabus.semesterPeriod}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/syllabus/${syllabus.id}`)}>
                          View Details
                        </Button>
                        <Button variant="success" size="sm" className="flex-1">
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Returned Tab Content */}
        <TabsContent value="returned" className="space-y-6">
          <div className="flex items-center gap-3 mt-6">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Returned for Revision</h2>
              <p className="text-sm text-muted-foreground">Syllabi that need updates based on reviewer feedback</p>
            </div>
          </div>

          {returnedSyllabi.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No syllabi returned for revision</h3>
                <p className="text-muted-foreground">All your syllabi are either approved or still in review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {returnedSyllabi.map((syllabus) => (
                <Card key={syllabus.id} className="shadow-soft border-destructive/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <XCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{syllabus.courseCode} - {syllabus.courseTitle}</h3>
                          <p className="text-sm text-muted-foreground">{syllabus.semesterPeriod}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/syllabus/${syllabus.id}`)}
                          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Revise Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Feedback */}
                    {syllabus.feedback && (
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground text-sm mb-1">Reviewer Feedback</p>
                            <p className="text-sm text-muted-foreground">{syllabus.feedback}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}