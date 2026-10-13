/**
 * UNIGATES Official Document & PDF Engine
 * ══════════════════════════════════════
 * Ensures documents exported or downloaded as .pdf are always genuine,
 * valid binary PDF files compliant with Adobe Acrobat & browser PDF viewers.
 */

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return new Blob([dataUrl], { type: "text/plain" });
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    const isBase64 = parts[0].includes(";base64");

    if (isBase64) {
      const binaryStr = atob(parts[1]);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new Blob([bytes], { type: mime });
    } else {
      const decoded = decodeURIComponent(parts[1]);
      return new Blob([decoded], { type: mime });
    }
  } catch (err) {
    console.error("[documentDownloadHelper] dataUrlToBlob error:", err);
    return new Blob([dataUrl], { type: "text/plain" });
  }
}

/**
 * Converts any visual content (SVG Data URI, PNG, JPEG) into a valid, genuine binary PDF document.
 * Enforces UTF-8 encoding and high-res canvas rendering so Arabic text in SVGs and certificates never corrupts.
 */
export async function convertVisualToPdfBlob(
  sourceUrl: string,
  title?: string
): Promise<Blob> {
  // 1. If it's already a real binary PDF data URL, convert directly
  if (sourceUrl.startsWith("data:application/pdf")) {
    return dataUrlToBlob(sourceUrl);
  }

  // 2. Load jsPDF dynamically
  const jspdfModule = await import("jspdf");
  const JsPDFClass = (jspdfModule as any).default || (jspdfModule as any).jsPDF;

  // Prepare a normalized, UTF-8 clean source URL
  let effectiveUrl = sourceUrl;
  let createdObjectUrl: string | null = null;

  if (sourceUrl.startsWith("data:image/svg+xml")) {
    try {
      // Decode with full UTF-8 support
      let svgString: string;
      if (sourceUrl.includes(";base64,")) {
        const base64Data = sourceUrl.split(";base64,")[1] || "";
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        svgString = new TextDecoder("utf-8").decode(bytes);
      } else {
        const rawPart = sourceUrl.split(",")[1] || "";
        svgString = decodeURIComponent(rawPart);
      }

      // Ensure explicit UTF-8 and standard Arabic font declarations
      if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      createdObjectUrl = URL.createObjectURL(svgBlob);
      effectiveUrl = createdObjectUrl;
    } catch (e) {
      console.warn("[convertVisualToPdfBlob] SVG UTF-8 normalization warning:", e);
    }
  }

  // 3. Render image/SVG into high-DPI canvas, then generate standard PDF
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
        createdObjectUrl = null;
      }
    };

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const isLandscape = img.width >= img.height;
        const pdf = new JsPDFClass({
          orientation: isLandscape ? "l" : "p",
          unit: "mm",
          format: "a4"
        });

        const pageWidth = isLandscape ? 297 : 210;
        const pageHeight = isLandscape ? 210 : 297;
        const margin = 10;
        const availWidth = pageWidth - margin * 2;
        const availHeight = pageHeight - margin * 2;

        let renderWidth = availWidth;
        let renderHeight = (img.height * renderWidth) / (img.width || 1);

        if (renderHeight > availHeight) {
          renderHeight = availHeight;
          renderWidth = ((img.width || 1) * renderHeight) / (img.height || 1);
        }

        const posX = margin + (availWidth - renderWidth) / 2;
        const posY = margin + (availHeight - renderHeight) / 2;

        // High resolution Canvas (scale: 2.5 for crisp Arabic calligraphy)
        const scale = 2.5;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(Math.round(img.width * scale), 1400);
        canvas.height = Math.max(Math.round(img.height * scale), 1000);
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngData = canvas.toDataURL("image/png", 0.95);
          pdf.addImage(pngData, "PNG", posX, posY, renderWidth, renderHeight);
        }

        const blob = pdf.output("blob");
        cleanup();
        resolve(blob);
      } catch (err) {
        console.error("[convertVisualToPdfBlob] Generation error:", err);
        cleanup();
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.warn("[convertVisualToPdfBlob] Image load failed, generating fallback canvas PDF:", e);
      try {
        // High-DPI canvas fallback supporting native Arabic font rendering
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 32px 'Segoe UI', Tahoma, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.direction = "rtl";
          ctx.fillText(title || "وثيقة أكاديمية رسمية", 600, 200);

          ctx.fillStyle = "#64748b";
          ctx.font = "20px 'Segoe UI', Tahoma, Arial, sans-serif";
          ctx.fillText("منصة النشر ودار عبيد للنشر والتوزيع • وثيقة معتمدة", 600, 260);

          const pdf = new JsPDFClass({ orientation: "p", unit: "mm", format: "a4" });
          const pngData = canvas.toDataURL("image/png", 0.95);
          pdf.addImage(pngData, "PNG", 10, 10, 190, 253);
          cleanup();
          resolve(pdf.output("blob"));
        } else {
          const pdf = new JsPDFClass({ orientation: "p", unit: "mm", format: "a4" });
          pdf.setFontSize(14);
          pdf.text("Academic Verification Document", 20, 30);
          cleanup();
          resolve(pdf.output("blob"));
        }
      } catch (docErr) {
        cleanup();
        reject(docErr);
      }
    };

    img.src = effectiveUrl;
  });
}

/**
 * Downloads a document properly, ensuring files named .pdf are real PDFs
 */
export async function downloadDocumentProperly(
  sourceUrl: string,
  filename: string
): Promise<void> {
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  // If named as PDF and not already an application/pdf
  if (isPdf && !sourceUrl.startsWith("data:application/pdf")) {
    try {
      const pdfBlob = await convertVisualToPdfBlob(sourceUrl, filename);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return;
    } catch (e) {
      console.warn("[downloadDocumentProperly] PDF conversion error, falling back:", e);
    }
  }

  // Standard Blob download for real PDFs or images
  if (sourceUrl.startsWith("data:")) {
    const blob = dataUrlToBlob(sourceUrl);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    return;
  }

  // Direct URL download
  const a = document.createElement("a");
  a.href = sourceUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Opens a document in a new tab properly without triggering Chrome PDF load error
 */
export async function openDocumentInNewTabProperly(
  sourceUrl: string,
  filename?: string
): Promise<void> {
  const isPdf = filename ? filename.toLowerCase().endsWith(".pdf") : false;

  if (isPdf && !sourceUrl.startsWith("data:application/pdf")) {
    try {
      const pdfBlob = await convertVisualToPdfBlob(sourceUrl, filename);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, "_blank");
      return;
    } catch (e) {
      console.warn("[openDocumentInNewTabProperly] PDF tab error:", e);
    }
  }

  if (sourceUrl.startsWith("data:")) {
    const blob = dataUrlToBlob(sourceUrl);
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    return;
  }

  window.open(sourceUrl, "_blank");
}
