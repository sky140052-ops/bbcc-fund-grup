import { NextRequest, NextResponse } from "next/server";

let lastPingTime = new Date().toISOString();
let pingCount = 0;

// Internal self-pinger loop (runs if server is active and RENDER_EXTERNAL_URL is set)
if (typeof global !== "undefined" && !(global as any).__dfi_pinger_started) {
  (global as any).__dfi_pinger_started = true;

  const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_EXTERNAL_URL) {
    // Ping every 10 minutes (600,000 ms)
    setInterval(async () => {
      try {
        const pingUrl = `${RENDER_EXTERNAL_URL}/api/keep-alive`;
        await fetch(pingUrl, { method: "GET" });
        console.log(`[DFI Keep-Alive] Self ping sent to ${pingUrl}`);
      } catch (err) {
        console.warn("[DFI Keep-Alive] Self ping failed:", err);
      }
    }, 10 * 60 * 1000);
  }
}

export async function GET(req: NextRequest) {
  pingCount++;
  lastPingTime = new Date().toISOString();

  return NextResponse.json({
    status: "active",
    message: "DFI Server is awake and running (Anti-Sleep Active)",
    timestamp: lastPingTime,
    uptime_seconds: Math.floor(process.uptime()),
    ping_count: pingCount,
    server: "Render Production Node.js",
  });
}
