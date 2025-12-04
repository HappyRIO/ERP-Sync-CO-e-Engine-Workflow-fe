import { useState, useRef } from "react";
import { Camera, X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PhotoCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoCapture({ photos, onPhotosChange, maxPhotos = 10 }: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onPhotosChange([...photos, result]);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={openCamera}
          disabled={photos.length >= maxPhotos}
          className="flex-1"
          size="lg"
        >
          <Camera className="h-5 w-5 mr-2" />
          Take Photo
        </Button>
        <Button
          type="button"
          onClick={openFilePicker}
          disabled={photos.length >= maxPhotos}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        multiple={maxPhotos > 1}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple={maxPhotos > 1}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={photo}
                    alt={`Evidence photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No photos captured yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap "Take Photo" or "Upload" to add evidence photos
            </p>
          </CardContent>
        </Card>
      )}

      {photos.length > 0 && photos.length < maxPhotos && (
        <p className="text-xs text-muted-foreground text-center">
          {photos.length} of {maxPhotos} photos captured
        </p>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-xs text-warning-foreground text-center">
          Maximum {maxPhotos} photos reached
        </p>
      )}
    </div>
  );
}

