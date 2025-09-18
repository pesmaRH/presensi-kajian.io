import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Camera, Square, Smartphone } from 'lucide-react';

function QRScanner({ onScan, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanning = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      setIsScanning(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      onError?.('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsScanning(false);
  };

  const captureAndProcess = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Simple URL extraction from canvas (basic implementation)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // For now, we'll simulate QR detection
    // In production, you'd use a proper QR detection library like jsQR
    const mockUrl = prompt('Manual Input: Masukkan URL atau kode kajian:');
    if (mockUrl) {
      // Extract kajian ID from URL
      const match = mockUrl.match(/\/presensi\/([a-zA-Z0-9-]+)/);
      if (match) {
        onScan?.(match[1]);
        stopScanning();
      } else {
        onError?.('Format QR Code tidak valid');
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Camera className="w-5 h-5" />
          <span>Scan QR Code</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isScanning ? (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay for QR scanning guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={captureAndProcess}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Square className="w-4 h-4 mr-2" />
                Capture QR
              </Button>
              <Button 
                variant="outline" 
                onClick={stopScanning}
                className="flex-1"
              >
                Batal
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-600">
              Arahkan kamera ke QR Code kajian, lalu tekan "Capture QR"
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-400" />
            </div>
            
            <Button 
              onClick={startScanning}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              Mulai Scan QR
            </Button>
            
            <p className="text-xs text-gray-600">
              Gunakan kamera untuk scan QR code kajian
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QRScanner;