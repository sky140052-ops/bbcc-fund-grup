/**
 * DFI Internal Self-Pinger & Anti-Sleep Engine
 * Keeps Render free services 100% awake by pinging its public URL every 5 minutes.
 * Render sleeps after 15 minutes of inactivity; 5-minute pings completely prevent sleep mode.
 */

let isPingerActive = false;

export function startSelfPinger() {
  if (typeof global === "undefined") return;
  if ((global as any).__dfi_self_pinger_started) return;

  (global as any).__dfi_self_pinger_started = true;
  isPingerActive = true;

  const externalUrl = (process.env.RENDER_EXTERNAL_URL || "https://bbcc-grup.onrender.com").trim().replace(/\/$/, "");
  const pingIntervalMs = 5 * 60 * 1000; // 5 minutes

  console.log(`[DFI Anti-Sleep] Pinger loop initiated. Target: ${externalUrl}/api/keep-alive (Every 5 mins)`);

  setInterval(async () => {
    try {
      const pingEndpoint = `${externalUrl}/api/keep-alive`;
      const res = await fetch(pingEndpoint, {
        method: "GET",
        headers: {
          "User-Agent": "DFI-AntiSleep-SelfPinger/2026",
          "Cache-Control": "no-cache",
        },
      });

      console.log(`[DFI Anti-Sleep Ping] OK (${res.status}) at ${new Date().toLocaleTimeString("hi-IN", { timeZone: "Asia/Kolkata" })}`);
    } catch (err: any) {
      console.warn(`[DFI Anti-Sleep Ping] Warning:`, err?.message || err);
    }
  }, pingIntervalMs);
}

// Auto-run if Node environment
if (typeof process !== "undefined" && process.env) {
  startSelfPinger();
}
