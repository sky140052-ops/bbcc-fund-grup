"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, Check, Share2, PlusSquare, Sparkles, X } from "lucide-react";

interface InstallAppButtonProps {
  className?: string;
  variant?: "pill" | "banner" | "button" | "card";
}

export default function InstallAppButton({
  className = "",
  variant = "button",
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed or inside native app)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://") ||
        window.location.search.includes("mode=app") ||
        window.location.search.includes("source=pwa") ||
        localStorage.getItem("dfi_app_mode") === "true";

      if (isStandalone) {
        setIsInstalled(true);
      }
    }

    // Detect iOS
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isApple);
    }

    // Listen for Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      window.location.href = "/dashboard";
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Fallback: Redirect to /install instruction page or prompt
      window.location.href = "/install";
    }
  };

  // If already installed or running inside native Android / PWA app mode, DO NOT SHOW INSTALL BUTTON AT ALL!
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {variant === "pill" && (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>📱 ऐप डाउनलोड</span>
        </button>
      )}

      {variant === "button" && (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>📱 मोबाइल ऐप डाउनलोड / इनस्टॉल करें</span>
        </button>
      )}

      {variant === "banner" && (
        <div
          className={`p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>DFI मोबाइल ऐप उपलब्ध है</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                  ऑटो-अपडेट
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                बार-बार लॉगिन की जरूरत नहीं • ऐप खोलते ही सीधे आपका डैशबोर्ड खुलेगा
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 active:scale-95 transition shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>इनस्टॉल करें (1-क्लिक)</span>
          </button>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">iPhone / iPad पर ऐप इनस्टॉल करें</h3>
              <p className="text-xs text-slate-400">Safari ब्राउज़र में 2 सरल चरणों में इनस्टॉल करें:</p>
            </div>

            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-slate-200">
                    Safari के नीचे दिए गए <b>शेयर (Share)</b> बटन पर टैप करें:
                  </p>
                  <div className="flex items-center gap-1.5 text-blue-400 mt-1 font-semibold">
                    <Share2 className="w-4 h-4" />
                    <span>Share Icon</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-800 pt-3">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-slate-200">
                    नीचे स्क्रॉल करके <b>'Add to Home Screen (होम स्क्रीन पर जोड़ें)'</b> चुनें:
                  </p>
                  <div className="flex items-center gap-1.5 text-emerald-400 mt-1 font-semibold">
                    <PlusSquare className="w-4 h-4" />
                    <span>Add to Home Screen</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              समझ गया (Done)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
