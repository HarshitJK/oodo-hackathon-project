import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (token: string) => void;
  onScanError?: (errorMessage: string) => void;
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, isScanning, setIsScanning }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
        /* verbose= */ false
      );
      scannerRef.current.render(
        (decodedText) => {
          // Pause/stop scanning on success
          scannerRef.current?.clear().catch(console.error);
          setIsScanning(false);
          onScanSuccess(decodedText);
        },
        (error) => {
          if (onScanError) {
            onScanError(typeof error === "string" ? error : "Scan failed");
          }
        }
      );
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isScanning, onScanSuccess, onScanError, setIsScanning]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {isScanning && (
        <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-slate-900">
          <div id="qr-reader" className="w-full" />
          <div className="p-4 flex justify-center">
             <button
                onClick={() => setIsScanning(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-colors"
             >
                Cancel Scan
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
