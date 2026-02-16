import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ArrowRightCircle, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  FileSignature,
  MessageSquare,
  FileSpreadsheet,
  FileBarChart,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SignatureCanvas } from './SignatureCanvas';
import { Signature, REVIEWER_ACTIONS, ReviewAction } from './types';
import { UserRole, ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface ReviewPanelProps {
  userRole: UserRole;
  userId: string;
  userName: string;
  signature: Signature | null;
  onSignatureCreate: (signature: Signature) => void;
  onSignatureClear: () => void;
  onSubmit: (action: ReviewAction, comment: string) => void;
  isSubmitting?: boolean;
  className?: string;
  // Add Form 17/18 URLs as props
  form17Url?: string;
  form18Url?: string;
}

const MAX_COMMENT_LENGTH = 500;
const MIN_RETURN_REASON_LENGTH = 20;

export function ReviewPanel({
  userRole,
  userId,
  userName,
  signature,
  onSignatureCreate,
  onSignatureClear,
  onSubmit,
  isSubmitting = false,
  className,
  form17Url,
  form18Url,
}: ReviewPanelProps) {
  const [comment, setComment] = useState('');
  const [selectedAction, setSelectedAction] = useState<ReviewAction['type'] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reviewerActions = REVIEWER_ACTIONS[userRole];
  const characterCount = comment.length;
  const isOverLimit = characterCount > MAX_COMMENT_LENGTH;

  // Clear validation error when inputs change
  useEffect(() => {
    setValidationError(null);
  }, [comment, signature, selectedAction]);

  const validateSubmission = (): boolean => {
    if (!selectedAction) {
      setValidationError('Please select an action');
      return false;
    }

    if (selectedAction === 'approve' && !signature) {
      setValidationError('Signature is required for approval');
      return false;
    }

    if (selectedAction === 'return' && comment.trim().length < MIN_RETURN_REASON_LENGTH) {
      setValidationError(`Return reason must be at least ${MIN_RETURN_REASON_LENGTH} characters`);
      return false;
    }

    if (isOverLimit) {
      setValidationError(`Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`);
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateSubmission() || !selectedAction) return;

    const action: ReviewAction = {
      type: selectedAction,
      targetRole: selectedAction === 'forward' 
        ? reviewerActions?.actions.forward?.targetRole 
        : undefined,
    };

    onSubmit(action, comment);
  };

  const handleOpenForm = (url: string, formName: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert(`${formName} has not been uploaded yet.`);
    }
  };

  if (!reviewerActions) {
    return (
      <Card className={cn('shadow-soft', className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          No review actions available for your role.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Signature Section */}
      <SignatureCanvas
        userId={userId}
        userName={userName}
        userRole={userRole}
        existingSignature={signature}
        onSignatureCreate={onSignatureCreate}
        onSignatureClear={onSignatureClear}
      />

      {/* Form 17 & 18 Links Section */}
      {(form17Url || form18Url) && (
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Supporting Documents
            </CardTitle>
            <CardDescription>
              Review additional forms submitted by faculty
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Form 17 Card */}
            <div 
              className={cn(
                "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors",
                form17Url 
                  ? "hover:bg-accent border-border" 
                  : "opacity-60 border-muted cursor-not-allowed"
              )}
              onClick={() => form17Url && handleOpenForm(form17Url, 'Form 17')}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  form17Url ? "bg-blue-100" : "bg-muted"
                )}>
                  <FileSpreadsheet className={cn(
                    "h-5 w-5",
                    form17Url ? "text-blue-600" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-medium text-sm">Form 17</p>
                  <p className="text-xs text-muted-foreground">
                    {form17Url ? 'Click to view' : 'Not uploaded'}
                  </p>
                </div>
              </div>
              {form17Url && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Form 18 Card */}
            <div 
              className={cn(
                "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors",
                form18Url 
                  ? "hover:bg-accent border-border" 
                  : "opacity-60 border-muted cursor-not-allowed"
              )}
              onClick={() => form18Url && handleOpenForm(form18Url, 'Form 18')}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  form18Url ? "bg-green-100" : "bg-muted"
                )}>
                  <FileBarChart className={cn(
                    "h-5 w-5",
                    form18Url ? "text-green-600" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-medium text-sm">Form 18</p>
                  <p className="text-xs text-muted-foreground">
                    {form18Url ? 'Click to view' : 'Not uploaded'}
                  </p>
                </div>
              </div>
              {form18Url && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Review Comments
          </CardTitle>
          <CardDescription>
            Add feedback or notes for the faculty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comments here... (optional for forward, required for return)"
              className={cn(
                'min-h-[120px] resize-none',
                isOverLimit && 'border-destructive focus-visible:ring-destructive'
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                'text-muted-foreground',
                isOverLimit && 'text-destructive'
              )}>
                {characterCount} / {MAX_COMMENT_LENGTH} characters
              </span>
              {selectedAction === 'return' && comment.length < MIN_RETURN_REASON_LENGTH && (
                <span className="text-warning">
                  Min {MIN_RETURN_REASON_LENGTH} chars for return
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Review Actions</CardTitle>
          <CardDescription>
            Select an action based on your review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            {/* For CITL role: Show Approve, then Return, then Forward */}
            {userRole === 'citl' ? (
              <>
                {/* Approve Button - Always first for CITL */}
                {reviewerActions.actions.approve && (
                  <Button
                    variant={selectedAction === 'approve' ? 'default' : 'outline'}
                    className={cn(
                      'justify-start h-auto py-3',
                      selectedAction === 'approve' && 'bg-success hover:bg-success/90 ring-2 ring-success ring-offset-2'
                    )}
                    onClick={() => setSelectedAction('approve')}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{reviewerActions.actions.approve.label}</p>
                      <p className="text-xs opacity-70">
                        Complete the syllabus approval process
                      </p>
                    </div>
                  </Button>
                )}

                {/* Return Button - Second for CITL */}
                <Button
                  variant={selectedAction === 'return' ? 'destructive' : 'outline'}
                  className={cn(
                    'justify-start h-auto py-3',
                    selectedAction === 'return' && 'ring-2 ring-destructive ring-offset-2'
                  )}
                  onClick={() => setSelectedAction('return')}
                >
                  <RotateCcw className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">{reviewerActions.actions.return.label}</p>
                    <p className="text-xs opacity-70">
                      Request revisions from the faculty
                    </p>
                  </div>
                </Button>

                {/* Forward Button - Last for CITL */}
                {reviewerActions.actions.forward && (
                  <Button
                    variant={selectedAction === 'forward' ? 'default' : 'outline'}
                    className={cn(
                      'justify-start h-auto py-3',
                      selectedAction === 'forward' && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => setSelectedAction('forward')}
                  >
                    <ArrowRightCircle className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{reviewerActions.actions.forward.label}</p>
                      <p className="text-xs opacity-70">
                        Forward to {ROLE_LABELS[reviewerActions.actions.forward.targetRole]}
                      </p>
                    </div>
                  </Button>
                )}
              </>
            ) : (
              /* For other roles: Keep original order (Forward, Approve, Return) */
              <>
                {/* Forward Button */}
                {reviewerActions.actions.forward && (
                  <Button
                    variant={selectedAction === 'forward' ? 'default' : 'outline'}
                    className={cn(
                      'justify-start h-auto py-3',
                      selectedAction === 'forward' && 'ring-2 ring-primary ring-offset-2'
                    )}
                    onClick={() => setSelectedAction('forward')}
                  >
                    <ArrowRightCircle className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{reviewerActions.actions.forward.label}</p>
                      <p className="text-xs opacity-70">
                        Forward to {ROLE_LABELS[reviewerActions.actions.forward.targetRole]}
                      </p>
                    </div>
                  </Button>
                )}

                {/* Approve Button */}
                {reviewerActions.actions.approve && (
                  <Button
                    variant={selectedAction === 'approve' ? 'default' : 'outline'}
                    className={cn(
                      'justify-start h-auto py-3',
                      selectedAction === 'approve' && 'bg-success hover:bg-success/90 ring-2 ring-success ring-offset-2'
                    )}
                    onClick={() => setSelectedAction('approve')}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <p className="font-medium">{reviewerActions.actions.approve.label}</p>
                      <p className="text-xs opacity-70">
                        Complete the syllabus approval process
                      </p>
                    </div>
                  </Button>
                )}

                {/* Return Button */}
                <Button
                  variant={selectedAction === 'return' ? 'destructive' : 'outline'}
                  className={cn(
                    'justify-start h-auto py-3',
                    selectedAction === 'return' && 'ring-2 ring-destructive ring-offset-2'
                  )}
                  onClick={() => setSelectedAction('return')}
                >
                  <RotateCcw className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">{reviewerActions.actions.return.label}</p>
                    <p className="text-xs opacity-70">
                      Request revisions from the faculty
                    </p>
                  </div>
                </Button>
              </>
            )}
          </div>

          <Separator />

          {/* Validation Requirements */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Requirements:</p>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <FileSignature className={cn(
                  'h-4 w-4',
                  signature ? 'text-success' : 'text-muted-foreground'
                )} />
                <span className={signature ? 'text-success' : 'text-muted-foreground'}>
                  Signature {selectedAction === 'approve' ? '(required)' : '(optional)'}
                </span>
                {signature && <Badge variant="success" className="text-xs">Signed</Badge>}
              </div>
              {selectedAction === 'return' && (
                <div className="flex items-center gap-2">
                  <MessageSquare className={cn(
                    'h-4 w-4',
                    comment.length >= MIN_RETURN_REASON_LENGTH 
                      ? 'text-success' 
                      : 'text-muted-foreground'
                  )} />
                  <span className={
                    comment.length >= MIN_RETURN_REASON_LENGTH 
                      ? 'text-success' 
                      : 'text-muted-foreground'
                  }>
                    Return reason (min {MIN_RETURN_REASON_LENGTH} chars)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedAction || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}