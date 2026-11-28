"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import type { Auth, ConfirmationResult } from "firebase/auth";

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigType = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMDD-oB-6UOmu43In05hxN90_Fl6sf1xA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dfi-app-6eb4b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dfi-app-6eb4b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dfi-app-6eb4b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "414935880259",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:414935880259:web:5969afbeed90c98b7bfaf6",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CW6WEJYT2D",
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export async function fetchRemoteFirebaseConfig(): Promise<FirebaseConfigType> {
  if (typeof window === "undefined") return DEFAULT_FIREBASE_CONFIG;
  try {
    const res = await fetch("/api/auth/firebase-config");
    if (res.ok) {
      const data = await res.json();
      if (data.config?.apiKey) {
        Object.assign(DEFAULT_FIREBASE_CONFIG, data.config);
      }
    }
  } catch (e) {
    console.warn("Could not fetch remote Firebase config, using defaults:", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function getFirebaseApp(customConfig?: Partial<FirebaseConfigType>): FirebaseApp | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!cachedApp) {
      if (getApps().length > 0) {
        cachedApp = getApp();
      } else {
        const config = { ...DEFAULT_FIREBASE_CONFIG, ...customConfig };
        cachedApp = initializeApp(config);
      }
    }
    return cachedApp;
  } catch (err) {
    console.warn("Firebase App initialization error:", err);
    return null;
  }
}

export function getFirebaseAuth(customConfig?: Partial<FirebaseConfigType>): Auth | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!cachedAuth) {
      const app = getFirebaseApp(customConfig);
      if (!app) return null;
      cachedAuth = getAuth(app);
      cachedAuth.languageCode = "hi";
    }
    return cachedAuth;
  } catch (err) {
    console.warn("Firebase Auth error:", err);
    return null;
  }
}

/**
 * Creates or resets a reCAPTCHA verifier attached to a DOM container.
 */
export function createRecaptchaVerifier(
  containerId: string = "recaptcha-container",
  customConfig?: Partial<FirebaseConfigType>,
  onVerify?: () => void,
  onExpire?: () => void
): RecaptchaVerifier | null {
  if (typeof window === "undefined") return null;

  const auth = getFirebaseAuth(customConfig);
  if (!auth) {
    throw new Error("Firebase Auth सक्रिय नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।");
  }

  // Clear existing window verifier if present
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    (window as any).recaptchaVerifier = null;
  }

  // Clear DOM container
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
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
  if (!auth) {
    throw new Error("Firebase Auth उपलब्ध नहीं है।");
  }
  const cleanDigits = mobileNumber.replace(/\D/g, "");
  const formattedNumber = cleanDigits.startsWith("91") && cleanDigits.length === 12
    ? `+${cleanDigits}`
    : `+91${cleanDigits.slice(-10)}`;

  return await signInWithPhoneNumber(auth, formattedNumber, verifier);
}
