"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

export const DEFAULT_FIREBASE_CONFIG = {
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

export function getFirebaseApp(customConfig?: Partial<typeof DEFAULT_FIREBASE_CONFIG>): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase client is only available in the browser.");
  }
  if (!cachedApp) {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      const config = { ...DEFAULT_FIREBASE_CONFIG, ...customConfig };
      cachedApp = initializeApp(config);
    }
  }
  return cachedApp;
}

export function getFirebaseAuth(customConfig?: Partial<typeof DEFAULT_FIREBASE_CONFIG>): Auth {
  if (typeof window === "undefined") {
    throw new Error("Firebase auth is only available in the browser.");
  }
  if (!cachedAuth) {
    const app = getFirebaseApp(customConfig);
    cachedAuth = getAuth(app);
    // Explicitly configure language code to Hindi / Indian English
    cachedAuth.languageCode = "hi";
  }
  return cachedAuth;
}

/**
 * Creates or resets a reCAPTCHA verifier attached to a DOM container.
 */
export function createRecaptchaVerifier(
  containerId: string = "recaptcha-container",
  onVerify?: () => void,
  onExpire?: () => void
): RecaptchaVerifier {
  const auth = getFirebaseAuth();

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
