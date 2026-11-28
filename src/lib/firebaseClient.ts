"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const ENV_FIREBASE_CONFIG: FirebaseConfigType = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export async function fetchRemoteFirebaseConfig(): Promise<FirebaseConfigType> {
  // If already present in env, return immediately
  if (ENV_FIREBASE_CONFIG.apiKey && ENV_FIREBASE_CONFIG.projectId) {
    return ENV_FIREBASE_CONFIG;
  }
  try {
    const res = await fetch("/api/auth/firebase-config");
    if (res.ok) {
      const data = await res.json();
      if (data.config?.apiKey) {
        return data.config;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch remote firebase config:", e);
  }
  return ENV_FIREBASE_CONFIG;
}

export function getFirebaseApp(customConfig?: Partial<FirebaseConfigType>): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client is only available in the browser.");
  }
  if (!cachedApp) {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      const config = { ...ENV_FIREBASE_CONFIG, ...customConfig };
      if (!config.apiKey || !config.projectId) {
        throw new Error("Firebase API Key अथवा Project ID Render Environment में सेट नहीं है। कृपया Render Dashboard में ENV चर सेट करें।");
      }
      cachedApp = initializeApp(config);
    }
  }
  return cachedApp;
}

export function getFirebaseAuth(customConfig?: Partial<FirebaseConfigType>): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth is only available in the browser.");
  }
  if (!cachedAuth) {
    const app = getFirebaseApp(customConfig);
    cachedAuth = getAuth(app);
    cachedAuth.languageCode = "hi";
  }
  return cachedAuth;
}

/**
 * Creates or resets a reCAPTCHA verifier attached to a DOM container.
 */
export function createRecaptchaVerifier(
  containerId: string = "recaptcha-container",
  customConfig?: Partial<FirebaseConfigType>,
  onVerify?: () => void,
  onExpire?: () => void
): RecaptchaVerifier {
  const auth = getFirebaseAuth(customConfig);

  // Clear any existing window recaptcha instance
  if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch {
      // ignore
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      if (onVerify) onVerify();
    },
    "expired-callback": () => {
      if (onExpire) onExpire();
    },
  });

  if (typeof window !== "undefined") {
    (window as any).recaptchaVerifier = verifier;
  }

  return verifier;
}

/**
 * Sends SMS OTP to an Indian mobile number (+91)
 */
export async function sendFirebasePhoneOtp(
  mobileNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const cleanDigits = mobileNumber.replace(/\D/g, "");
  const formattedNumber = cleanDigits.startsWith("91") && cleanDigits.length === 12
    ? `+${cleanDigits}`
    : `+91${cleanDigits.slice(-10)}`;

  return await signInWithPhoneNumber(auth, formattedNumber, verifier);
}
