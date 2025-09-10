import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity?: { id: string; name: string; country: string };
}

export function CameraCapture({ isOpen, onClose, currentCity }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cityName, setCityName] = useState(currentCity?.name || '');
  const [stateName, setStateName] = useState('');
  const [caption, setCaption] = useState('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Start camera with permissions
  const startCamera = useCallback(async () => {
    setIsStartingCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to take travel photos.",
        variant: "destructive",
      });
    } finally {
      setIsStartingCamera(false);
    }
  }, [toast]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Capture photo and optimize
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to optimized JPEG with 80% quality for smaller file size
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    stopCamera();
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (photoData: { 
      photoBlob: Blob; 
      cityName: string; 
      stateName: string; 
      caption: string; 
      cityId?: string;
    }) => {
      // First get upload URL
      const uploadResponse = await apiRequest('POST', '/api/photos/upload');
      const { uploadURL } = uploadResponse;
      
      // Upload photo to object storage
      await fetch(uploadURL, {
        method: 'PUT',
        body: photoData.photoBlob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });
      
      // Save photo metadata
      return apiRequest('POST', '/api/photos', {
        photoUrl: uploadURL.split('?')[0], // Remove query params
        cityName: photoData.cityName,
        stateName: photoData.stateName,
        caption: photoData.caption,
        cityId: photoData.cityId,
        fileSize: photoData.photoBlob.size,
        originalFileName: `travel_photo_${Date.now()}.jpg`,
      });
    },
    onSuccess: () => {
      toast({
        title: "Photo Saved! 📸",
        description: `Your travel photo from ${cityName} has been added to your collection.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/photos'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Couldn't save your photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save photo
  const savePhoto = useCallback(async () => {
    if (!capturedPhoto || !cityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a city name for your photo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert data URL to blob for upload
      const response = await fetch(capturedPhoto);
      const photoBlob = await response.blob();
      
      uploadPhotoMutation.mutate({
        photoBlob,
        cityName: cityName.trim(),
        stateName: stateName.trim(),
        caption: caption.trim(),
        cityId: currentCity?.id,
      });
    } catch (error) {
      console.error('Photo processing error:', error);
      toast({
        title: "Processing Error",
        description: "Couldn't process your photo. Please try again.",
        variant: "destructive",
      });
    }
  }, [capturedPhoto, cityName, stateName, caption, currentCity?.id, uploadPhotoMutation, toast]);

  // Reset form
  const resetForm = useCallback(() => {
    setCapturedPhoto(null);
    setCityName(currentCity?.name || '');
    setStateName('');
    setCaption('');
    stopCamera();
  }, [currentCity?.name, stopCamera]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    stopCamera();
    resetForm();
    onClose();
  }, [stopCamera, resetForm, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Capture Travel Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Photo Display */}
          <div className="relative">
            {!stream && !capturedPhoto && (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Button 
                  onClick={startCamera}
                  disabled={isStartingCamera}
                  className="gap-2"
                  data-testid="button-start-camera"
                >
                  <Camera className="w-4 h-4" />
                  {isStartingCamera ? 'Starting Camera...' : 'Start Camera'}
                </Button>
              </div>
            )}
            
            {stream && !capturedPhoto && (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <Button 
                    onClick={capturePhoto}
                    size="lg"
                    className="rounded-full w-16 h-16 bg-white hover:bg-gray-100"
                    data-testid="button-capture-photo"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full" />
                  </Button>
                </div>
              </div>
            )}
            
            {capturedPhoto && (
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <img 
                  src={capturedPhoto} 
                  alt="Captured travel photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <Button 
                    onClick={retakePhoto}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    data-testid="button-retake-photo"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Photo Details Form */}
          {capturedPhoto && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cityName">City *</Label>
                <Input
                  id="cityName"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="Enter city name"
                  data-testid="input-city-name"
                />
              </div>
              
              <div>
                <Label htmlFor="stateName">State/Region</Label>
                <Input
                  id="stateName"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="Enter state or region"
                  data-testid="input-state-name"
                />
              </div>
              
              <div>
                <Label htmlFor="caption">Caption (Optional)</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a memory or note about this place..."
                  rows={2}
                  data-testid="input-photo-caption"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={savePhoto}
                  disabled={uploadPhotoMutation.isPending || !cityName.trim()}
                  className="flex-1 gap-2"
                  data-testid="button-save-photo"
                >
                  <Check className="w-4 h-4" />
                  {uploadPhotoMutation.isPending ? 'Saving...' : 'Save Photo'}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  data-testid="button-cancel-photo"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for photo processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}