export async function performLogout() {
  if (typeof window !== "undefined") {
    // 1. Immediately wipe all local & session storage
    try {
      localStorage.removeItem("dfi_token");
      localStorage.removeItem("dfi_user");
      localStorage.removeItem("dfi_user_email");
      sessionStorage.clear();

      // 2. Disable Google One Tap auto-select so user is not automatically logged back in
      const g = (window as any).google;
      if (g?.accounts?.id?.disableAutoSelect) {
        g.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.warn("Storage cleanup failed:", e);
    }
  }

  // 3. Clear server session cookie
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (e) {
    console.warn("Logout API failed:", e);
  }

  // 4. Force full page redirect to root login window immediately
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}
