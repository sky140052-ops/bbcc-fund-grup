"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If user opens /login directly, redirect to home and open login modal
    router.replace("/?open_login=true");
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-semibold text-sm">DFI पोर्टल पर पुनर्निर्देशित किया जा रहा है...</p>
      </div>
    </div>
  );
}
