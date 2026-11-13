# 🏛️ BBCC FUND GRUP (बीबीसीसी फंड ग्रुप)

पारदर्शी बचत एवं सहयोग समिति वेब एप्लीकेशन (Digital Chit & Mutual Aid Web App)  
बिल्ट विथ **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **DataStax Astra DB**, **Bcrypt.js**, **Resend / Gmail SMTP (Free OTP)**, एवं **Razorpay Payment Gateway**।

---

## 🚀 मुख्य सुविधाएं (Features & Security)

1. **🔐 ईमेल (Gmail) व सुरक्षित पासवर्ड लॉगिन (Secure Unified Login):**
   - **मुख्य लॉगिन ID:** पंजीकृत ईमेल (Gmail).
   - **पासवर्ड:** सदस्य व मैनेजर अपनी पसंद का सुरक्षित पासवर्ड बनाते हैं (Bcrypt Salt 12 हैश द्वारा सुरक्षित).
   - **याद रखें (Remember Me):** 30 दिनों तक लॉगिन रहने का विकल्प।

2. **✉️ निःशुल्क ईमेल OTP लॉगिन (Free Email OTP Login):**
   - बिना पासवर्ड केवल ईमेल पर 6-अंकों का OTP प्राप्त कर डायरेक्ट सुरक्षित लॉगिन।
   - **Resend API** (3,000 फ्री ईमेल/माह) या **Gmail SMTP** (500 फ्री ईमेल/दिन) सपोर्टेड।

3. **🔄 पासवर्ड भूल जाने पर रीसेट (Forgot Password Workflow):**
   - यदि कोई पासवर्ड भूल जाए तो वह अपना पंजीकृत **मोबाइल नंबर** और **जन्मतिथि (DOB)** दर्ज करेगा।
   - सिस्टम स्वतः उसके रजिस्टर्ड ईमेल पर 6-अंकीय OTP भेजेगा।
   - OTP सत्यापित होते ही वह अपना नया पासवर्ड सेट कर सकेगा।

4. **🛡️ 100% सुरक्षा एवं जीरो डमी डेटा (Enterprise Security):**
   - **Aadhaar Protection:** वास्तविक आधार नंबर कभी डेटाबेस में स्टोर नहीं होता; केवल अंतिम 4 अंक और HMAC-SHA256 हैश सुरक्षित रखा जाता है।
   - **Bcrypt Hashing:** सभी पासवर्ड्स 12 राउंड साल्ट के साथ एन्क्रिप्टेड हैं।
   - **HttpOnly Cookies:** JWT सेशन टोकन सुरक्षित कुकीज में संचित होते हैं (XSS एवं CSRF सुरक्षित).

5. **👑 मुख्य फाउंडर व MD पैनल:**
   - **फाउंडर (Super Admin):** Render Environment Variables से सुरक्षित लॉगिन (ID: आधार/ईमेल, Pws: जन्मतिथि).
   - **मैनेजिंग डायरेक्टर (MD):** फाउंडर द्वारा नियुक्त किया जाता है या किसी मौजूदा सदस्य को MD बनाया जा सकता है।
   - **सदस्य जोड़ना:** फाउंडर व MD दोनों नए सदस्यों का विवरण, ईमेल और पासवर्ड दर्ज कर सकते हैं।

6. **📜 आधिकारिक नियम व शर्तें (Hindi Rules Page):**
   - `/rules` पर स्पष्ट 9 नियम लिखे हैं जो हर सदस्य को पारदर्शी रूप से दिखते हैं।

7. **💰 अधिकतम निकासी सीमा (Capped by Pool Balance):**
   - सदस्य केवल उतना ही फंड मांग सकते हैं जितना वर्तमान में ग्रुप पूल में उपलब्ध है।

8. **📅 पैसा लौटाने की निर्धारित तारीख (Repayment Date):**
   - निकासी आवेदन के समय सदस्य को लौटाने की तारीख (दिन) चुननी होती है।

9. **✂️ फिक्स ₹20 कटौती (Platform Fee):**
   - स्वीकृत राशि में से फाउंडर ₹20 काटकर शेष राशि ट्रांसफर करता है।

10. **📈 ₹1 सैकड़ा प्रतिमाह ब्याज (1% Monthly Interest):**
    - फाउंडर द्वारा पैसे ट्रांसफर किए जाने की तारीख से 1% प्रतिमाह (₹1 सैकड़ा) साधारण ब्याज लगना शुरू होता है।

11. **🗳️ पारदर्शी वोटिंग एवं दोहरा अप्रूवल (Dual Approval):**
    - सदस्य एक-दूसरे के आवेदन पर वोट करते हैं।
    - सर्वाधिक वोट पाने वाले को **फाउंडर + MD** दोनों के अप्रूवल के बाद फंड मिलता है।

12. **📸 फाउंडर पेमेंट व स्क्रीनशॉट प्रमाण:**
    - फाउंडर सीधे बैंक/UPI से ट्रांसफर करके **पेमेंट स्क्रीनशॉट** व **UTR नंबर** अपलोड करता है।

---

## 🛠️ Render पर आवश्यक Environment Variables

Render के **Environment** टैब में निम्नलिखित कीज़ दर्ज करें:

| Key | Example / Description |
|---|---|
| `FOUNDER_EMAIL` | `admin@gmail.com` |
| `FOUNDER_AADHAAR` | `649712349707` |
| `FOUNDER_PASSWORD` | `09042001` |
| `RESEND_API_KEY` | `re_123456...` (Free Resend API Key) OR |
| `SMTP_EMAIL` | आपका जीमेल (उदा. `myemail@gmail.com`) |
| `SMTP_PASSWORD` | आपका 16-अंकीय Gmail App Password |
| `ASTRA_DB_API_ENDPOINT` | DataStax Astra DB Endpoint URL |
| `ASTRA_DB_APPLICATION_TOKEN` | AstraCS:... Application Token |
| `ASTRA_DB_KEYSPACE` | `default_keyspace` |
| `RAZORPAY_KEY_ID` | `rzp_live_...` या `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `JWT_SECRET` | कोई भी सुरक्षित रैंडम सीक्रेट की |

---

## 🛠️ प्रोजेक्ट सेटअप व रन (How to Run)

### 1. डिपेंडेंसी इंस्टॉल करें:
```bash
npm install
```

### 2. एनवायरनमेंट वेरिएबल्स (.env.local):
`.env.local` फाइल में अपने Astra DB और Razorpay क्रेडेंशियल्स दर्ज करें:
```env
ASTRA_DB_API_ENDPOINT="https://<your-astra-db-id>-<region>.apps.astra.datastax.com"
ASTRA_DB_APPLICATION_TOKEN="AstraCS:..."
ASTRA_DB_KEYSPACE="default_keyspace"

RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."

FOUNDER_AADHAAR="649712349707"
FOUNDER_PASSWORD="09042001"
```

### 3. डेवलपमेंट सर्वर शुरू करें:
```bash
npm run dev
```
ब्राउज़र में खोलें: `http://localhost:3000`

---

## 📁 प्रोजेक्ट संरचना (Folder Structure)

```
c:\Users\HP\Desktop\fund grup\
├── src/
│   ├── app/
│   │   ├── page.tsx               # होमपेज
│   │   ├── layout.tsx             # नेविगेशन व फुटर
│   │   ├── globals.css            # टेलविंड स्टाइलिंग
│   │   ├── login/page.tsx         # एकल स्मार्ट लॉगिन
│   │   ├── rules/page.tsx         # 9 आधिकारिक नियम (हिंदी)
│   │   ├── admin/page.tsx         # फाउंडर व MD एडमिन पैनल
│   │   ├── dashboard/page.tsx     # सदस्य डैशबोर्ड व वोटिंग
│   │   └── api/
│   │       ├── auth/              # लॉगिन, सेशन व लॉगआउट
│   │       ├── admin/             # सदस्य व मैनेजर जोड़ना
│   │       ├── groups/            # ग्रुप व पूल डेटा
│   │       ├── contributions/     # मासिक रेज़रपे अंशदान
│   │       ├── withdrawal/        # फंड निकासी आवेदन
│   │       ├── vote/              # कम्युनिटी वोटिंग
│   │       └── payout/            # डुअल अप्रूवल व स्क्रीनशॉट
│   └── lib/
│       ├── types.ts               # डेटा प्रकार व स्कीमा
│       ├── astra.ts               # Astra DB क्लाइंट व फॉलबैक
│       └── auth.ts                # स्मार्ट ऑथेंटिकेटर
├── package.json
└── tailwind.config.ts
```
