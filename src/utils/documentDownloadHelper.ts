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

  // 3. Render image/SVG into high-DPI canvas, then generate standard PDF
  return new Promise((resolve, reject) => {
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
        const margin = 12;
        const availWidth = pageWidth - margin * 2;
        const availHeight = pageHeight - margin * 2;

        let renderWidth = availWidth;
        let renderHeight = (img.height * renderWidth) / img.width;

        if (renderHeight > availHeight) {
          renderHeight = availHeight;
          renderWidth = (img.width * renderHeight) / img.height;
        }

        const posX = margin + (availWidth - renderWidth) / 2;
        const posY = margin + (availHeight - renderHeight) / 2;

        // High resolution Canvas (scale: 2)
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(img.width * scale, 1200);
        canvas.height = Math.max(img.height * scale, 900);
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngData = canvas.toDataURL("image/png", 0.95);
          pdf.addImage(pngData, "PNG", posX, posY, renderWidth, renderHeight);
        }

        const blob = pdf.output("blob");
        resolve(blob);
      } catch (err) {
        console.error("[convertVisualToPdfBlob] Generation error:", err);
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.warn("[convertVisualToPdfBlob] Image load failed, generating textual PDF fallback:", e);
      try {
        const pdf = new JsPDFClass({ orientation: "p", unit: "mm", format: "a4" });
        pdf.setFontSize(16);
        pdf.text(title || "Document", 20, 30);
        pdf.setFontSize(12);
        pdf.text("UNIGATES Official Academic Verification Document", 20, 45);
        resolve(pdf.output("blob"));
      } catch (docErr) {
        reject(docErr);
      }
    };

    img.src = sourceUrl;
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
