import crypto from "crypto";

// PhonePe API Environments
const PROD_API_URL = "https://api.phonepe.com/apis/hermes";
const UAT_API_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

export function getPhonePeConfig() {
  const merchantId = (process.env.PHONEPE_MERCHANT_ID || "").trim();
  const saltKey = (process.env.PHONEPE_SALT_KEY || "").trim();
  const saltIndex = (process.env.PHONEPE_SALT_INDEX || "1").trim();
  const envMode = (process.env.PHONEPE_ENV || "PROD").trim().toUpperCase();

  const isConfigured = Boolean(merchantId && saltKey && !merchantId.includes("placeholder"));
  const baseUrl = envMode === "UAT" || envMode === "SANDBOX" ? UAT_API_URL : PROD_API_URL;

  return {
    merchantId,
    saltKey,
    saltIndex,
    envMode,
    isConfigured,
    baseUrl,
  };
}

/**
 * Generate SHA256 checksum header for PhonePe requests
 * format: SHA256(endpoint_data + saltKey) + "###" + saltIndex
 */
export function generateChecksum(data: string, endpoint: string, saltKey: string, saltIndex: string): string {
  const stringToHash = data + endpoint + saltKey;
  const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
  return `${sha256}###${saltIndex}`;
}

/**
 * Verify Checksum returned by PhonePe
 */
export function verifyChecksum(responseString: string, saltKey: string, saltIndex: string, receivedChecksum: string): boolean {
  const calculated = generateChecksum(responseString, "", saltKey, saltIndex);
  return calculated === receivedChecksum;
}

/**
 * Query PhonePe Status API to verify payment success
 */
export async function checkPhonePeTransactionStatus(transactionId: string): Promise<{
  success: boolean;
  status: string;
  responseCode: string;
  amount: number;
  providerReferenceId?: string;
  raw?: any;
}> {
  const config = getPhonePeConfig();
  if (!config.isConfigured) {
    return { success: false, status: "NOT_CONFIGURED", responseCode: "CONFIG_ERROR", amount: 0 };
  }

  const endpoint = `/pg/v1/status/${config.merchantId}/${transactionId}`;
  const xVerify = generateChecksum("", endpoint, config.saltKey, config.saltIndex);

  try {
    const res = await fetch(`${config.baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": config.merchantId,
      },
    });

    const data = await res.json();
    const isSuccess = data?.success === true && data?.code === "PAYMENT_SUCCESS";
    const amountInPaise = data?.data?.amount || 0;

    return {
      success: isSuccess,
      status: data?.code || "FAILED",
      responseCode: data?.code || "",
      amount: amountInPaise / 100,
      providerReferenceId: data?.data?.providerReferenceId || data?.data?.transactionId,
      raw: data,
    };
  } catch (err: any) {
    console.error("PhonePe status check error:", err);
    return { success: false, status: "NETWORK_ERROR", responseCode: "FETCH_FAILED", amount: 0 };
  }
}
