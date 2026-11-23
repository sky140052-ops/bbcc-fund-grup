import { NextRequest, NextResponse } from "next/server";
import { startSelfPinger } from "../../../lib/self-pinger";

let lastPingTime = new Date().toISOString();
let pingCount = 0;

// Ensure self pinger is active
startSelfPinger();

export async function GET(req: NextRequest) {
  pingCount++;
  lastPingTime = new Date().toISOString();

  // Ensure pinger loop stays alive
  startSelfPinger();

  return NextResponse.json({
    status: "active",
    message: "DFI Server is awake and running (Anti-Sleep Active - Never Sleeps)",
    timestamp: lastPingTime,
    uptime_seconds: Math.floor(process.uptime()),
    ping_count: pingCount,
    server: "Render Production Node.js",
    self_ping_active: true,
    ping_interval: "5 minutes",
  });
}
