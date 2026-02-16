import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Check, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Signature, Point } from './types';
import { UserRole, ROLE_LABELS } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  userId: string;
  userName: string;
  userRole: UserRole;
  existingSignature?: Signature | null;
  onSignatureCreate: (signature: Signature) => void;
  onSignatureClear: () => void;
  className?: string;
}

export function SignatureCanvas({
  userId,
  userName,
  userRole,
  existingSignature,
  onSignatureCreate,
  onSignatureClear,
  className,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPointRef = useRef<Point | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Draw existing signature if present
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      };
      img.src = existingSignature.imageData;
      setHasDrawn(true);
    }
  }, [existingSignature]);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getPoint(e);
    lastPointRef.current = point;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  }, [getPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    const point = getPoint(e);

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
    setHasDrawn(true);
  }, [isDrawing, getPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onSignatureClear();
  }, [onSignatureClear]);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const imageData = canvas.toDataURL('image/png');
    
    const signature: Signature = {
      id: crypto.randomUUID(),
      imageData,
      signerId: userId,
      signerName: userName,
      signerRole: userRole,
      timestamp: new Date().toISOString(),
      position: { x: 0, y: 0 },
      pageNumber: 1,
    };

    onSignatureCreate(signature);
  }, [hasDrawn, userId, userName, userRole, onSignatureCreate]);

  return (
    <Card className={cn('shadow-soft', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4" />
          Digital Signature
        </CardTitle>
        <CardDescription>
          Sign below to authorize your review action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signer info */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{userName}</Badge>
          <Badge variant="outline">{ROLE_LABELS[userRole]}</Badge>
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Signature canvas */}
        <div 
          className={cn(
            'relative border-2 border-dashed rounded-xl overflow-hidden transition-colors',
            hasDrawn ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
          )}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-32 touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">Draw your signature here</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!hasDrawn}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveSignature}
            disabled={!hasDrawn}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Save Signature
          </Button>
        </div>

        {/* Signature status */}
        {existingSignature && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">
              Signature saved
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
