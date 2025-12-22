import { useState, useRef, useEffect, useCallback } from "react";
import { Pen, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SignatureCaptureProps {
  signature: string | null;
  onSignatureChange: (signature: string | null) => void;
}

export function SignatureCapture({ signature, onSignatureChange }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const dprRef = useRef(1);
  const onSignatureChangeRef = useRef(onSignatureChange);
  const [hasSignature, setHasSignature] = useState(!!signature);

  // Keep the callback ref up to date
  useEffect(() => {
    onSignatureChangeRef.current = onSignatureChange;
  }, [onSignatureChange]);

  // Initialize canvas once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctxRef.current = ctx;

    // Set canvas size (only once)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set drawing styles
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      
      if ("touches" in e && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      if ("clientX" in e) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      return { x: 0, y: 0 };
    };

    // Load existing signature if provided
    if (signature) {
      const img = new Image();
      img.onload = () => {
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
          ctxRef.current.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
          setHasSignature(true);
        }
      };
      img.src = signature;
    }

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!ctxRef.current) return;
      
      isDrawingRef.current = true;
      const coords = getCoordinates(e);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(coords.x, coords.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current || !ctxRef.current) return;
      
      const coords = getCoordinates(e);
      ctxRef.current.lineTo(coords.x, coords.y);
      ctxRef.current.stroke();
    };

    const saveSignatureInternal = () => {
      const canvas = canvasRef.current;
      if (!canvas || !ctxRef.current) return;
      
      try {
        // Check if canvas has any content
        const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((channel, index) => {
          // Check alpha channel (every 4th value)
          if (index % 4 === 3) {
            return channel > 0;
          }
          return false;
        });

        if (hasContent) {
          const dataUrl = canvas.toDataURL("image/png");
          onSignatureChangeRef.current(dataUrl);
          setHasSignature(true);
        } else {
          onSignatureChangeRef.current(null);
          setHasSignature(false);
        }
      } catch (error) {
        console.error("Error saving signature:", error);
      }
    };

    const stopDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (isDrawingRef.current && ctxRef.current) {
        isDrawingRef.current = false;
        // Auto-save signature after stroke completes
        saveSignatureInternal();
      }
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
      canvas.removeEventListener("touchcancel", stopDrawing);
    };
  }, []); // Only run once on mount to set up canvas and event listeners

  // Load signature from prop when it changes externally
  useEffect(() => {
    if (signature && canvasRef.current && ctxRef.current) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
        ctx.drawImage(img, 0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
        setHasSignature(true);
      };
      img.src = signature;
    }
  }, [signature]);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    // Check if canvas has any content
    const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = imageData.data.some((channel, index) => {
      // Check alpha channel (every 4th value)
      if (index % 4 === 3) {
        return channel > 0;
      }
      return false;
    });

    if (hasContent) {
      const dataUrl = canvas.toDataURL("image/png");
      onSignatureChange(dataUrl);
      setHasSignature(true);
    } else {
      onSignatureChange(null);
      setHasSignature(false);
    }
  }, [onSignatureChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;

    const ctx = ctxRef.current;
    // Clear the canvas visually
    ctx.clearRect(0, 0, canvas.width / dprRef.current, canvas.height / dprRef.current);
    setHasSignature(false);
    // Notify parent that signature is cleared
    onSignatureChangeRef.current(null);
  }, []);


  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardContent className="p-0">
          <canvas
            ref={canvasRef}
            className="w-full h-64 touch-none cursor-crosshair bg-white rounded-lg"
            style={{ minHeight: "256px" }}
          />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={clearSignature}
          variant="outline"
          className="w-full"
          size="lg"
          disabled={!hasSignature && !signature}
          title="Clear the canvas to start over"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Clear
        </Button>
      </div>

      {!hasSignature && !signature && (
        <div className="text-center">
          <Pen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Sign above using your finger or mouse
          </p>
        </div>
      )}

      {signature && (
        <div className="text-center">
          <p className="text-sm text-success font-medium">
            ✓ Signature captured
          </p>
        </div>
      )}
    </div>
  );
}

