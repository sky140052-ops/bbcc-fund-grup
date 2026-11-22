/**
 * Client-Side Image & Document Auto-Compression Utility
 * Uses HTML5 Canvas to resize and compress photos/documents before upload.
 * Reduces 5MB+ images down to crisp, lightweight JPEG payloads (5KB - 60KB).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

/**
 * Auto-compresses an image file or base64 data URL.
 * If input is a PDF, returns base64 without canvas modifications.
 */
export function compressImage(
  input: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 400, maxHeight = 400, quality = 0.75 } = options;

  return new Promise((resolve, reject) => {
    // Check if input is a PDF
    if (typeof input !== "string") {
      const isPdf =
        (input as File).type === "application/pdf" ||
        ((input as File).name && (input as File).name.toLowerCase().endsWith(".pdf"));
      if (isPdf) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(input);
        return;
      }
    }

    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // If 2D context fails, fallback to standard FileReader or original
          if (typeof input === "string") {
            resolve(input);
          } else {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(input);
          }
          return;
        }

        // Apply high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch (canvasErr) {
        console.warn("Canvas compression fallback:", canvasErr);
        if (typeof input === "string") resolve(input);
        else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(input);
        }
      }
    };

    img.onerror = () => {
      // Fallback if image fails to render
      if (typeof input === "string") {
        resolve(input);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(input);
      }
    };

    if (typeof input === "string") {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input);
    }
  });
}
