import { useState, useCallback, useRef } from 'react';
import { Signature, Point } from '../types';
import { UserRole } from '@/types';

interface UseSignatureProps {
  userId: string;
  userName: string;
  userRole: UserRole;
}

interface UseSignatureReturn {
  signature: Signature | null;
  isDrawing: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
  draw: (e: React.MouseEvent | React.TouchEvent) => void;
  stopDrawing: () => void;
  clearSignature: () => void;
  saveSignature: (position: Point, pageNumber: number) => void;
  hasSignature: boolean;
}

export function useSignature({ userId, userName, userRole }: UseSignatureProps): UseSignatureReturn {
  const [signature, setSignature] = useState<Signature | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<Point | null>(null);

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

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
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
    setSignature(null);
  }, []);

  const saveSignature = useCallback((position: Point, pageNumber: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    
    const newSignature: Signature = {
      id: crypto.randomUUID(),
      imageData,
      signerId: userId,
      signerName: userName,
      signerRole: userRole,
      timestamp: new Date().toISOString(),
      position,
      pageNumber,
    };

    setSignature(newSignature);
  }, [userId, userName, userRole]);

  const hasSignature = signature !== null || (() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((value, index) => index % 4 === 3 && value > 0);
  })();

  return {
    signature,
    isDrawing,
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    saveSignature,
    hasSignature,
  };
}
