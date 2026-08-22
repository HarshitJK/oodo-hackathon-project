import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, Clock } from "lucide-react";
import api from "../../api";

const QRCodeCard: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("00:00");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post("/attendance/generate-qr");
      if (res.data?.success) {
        setToken(res.data.token);
        setExpiresAt(new Date(res.data.expiresAt));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate QR");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiresAt.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        setToken(null);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 flex flex-col items-center shadow-lg">
      <div className="w-full flex items-center justify-between mb-4">
         <div>
            <h3 className="text-white font-bold">Generate Attendance QR</h3>
            <p className="text-slate-400 text-xs">Allow employees to check in by scanning</p>
         </div>
         <button
            onClick={generateQR}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
         >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {token ? "Regenerate" : "Generate QR"}
         </button>
      </div>

      {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

      {token ? (
        <div className="flex flex-col items-center bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
          <div className="bg-white p-3 rounded-xl mb-4">
            <QRCodeSVG value={token} size={200} />
          </div>
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <Clock className={`w-4 h-4 ${timeLeft === "Expired" ? "text-rose-500" : "text-emerald-400"}`} />
            <span className={timeLeft === "Expired" ? "text-rose-500" : ""}>
               {timeLeft === "Expired" ? "QR Expired" : `Expires in ${timeLeft}`}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center bg-slate-950 p-8 rounded-xl border border-slate-800 border-dashed w-full max-w-sm h-64 text-slate-500">
           <RefreshCw className="w-8 h-8 mb-3 opacity-20" />
           <p className="text-sm">Click Generate QR to begin</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeCard;
