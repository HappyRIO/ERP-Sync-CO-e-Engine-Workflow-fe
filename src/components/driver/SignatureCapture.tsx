import { useState, useRef, useEffect } from "react";
import { Pen, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SignatureCaptureProps {
  signature: string | null;
  onSignatureChange: (signature: string | null) => void;
}

export function SignatureCapture({ signature, onSignatureChange }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!signature);

  useEffect(() => {
    if (signature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = signature;
      }
    }
  }, [signature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
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
          x: (e.touches[0].clientX - rect.left) * dpr,
          y: (e.touches[0].clientY - rect.top) * dpr,
        };
      }
      if ("clientX" in e) {
        return {
          x: (e.clientX - rect.left) * dpr,
          y: (e.clientY - rect.top) * dpr,
        };
      }
      return { x: 0, y: 0 };
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const coords = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const coords = getCoordinates(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (isDrawing) {
        setIsDrawing(false);
        saveSignature();
      }
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
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
  }, [isDrawing]);

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check if canvas has any content
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSignatureChange(null);
      setHasSignature(false);
    }
  };

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
          className="flex-1"
          size="lg"
          disabled={!hasSignature && !signature}
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Clear
        </Button>
        {signature && (
          <Button
            type="button"
            onClick={() => {
              onSignatureChange(null);
              setHasSignature(false);
              clearSignature();
            }}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Remove
          </Button>
        )}
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

