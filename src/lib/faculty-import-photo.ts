export const FACULTY_PHOTO_HEADER = "صورة شخصية 4×6";
export const FACULTY_PHOTO_WIDTH = 400;
export const FACULTY_PHOTO_HEIGHT = 600;
export const MAX_FACULTY_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_FACULTY_WORKBOOK_BYTES = 20 * 1024 * 1024;
const MAX_FACULTY_PHOTOS_PER_WORKBOOK = 500;
const MAX_TOTAL_FACULTY_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_DECODED_FACULTY_PHOTO_PIXELS = 40_000_000;

export type FacultyPhotoContentType = "image/jpeg" | "image/png";

export interface EmbeddedFacultyPhoto {
  bytes: Uint8Array;
  contentType: FacultyPhotoContentType;
}

export interface FacultyPhotoPayload {
  content_type: FacultyPhotoContentType;
  data_base64: string;
}

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export function getFourBySixCrop(width: number, height: number): CropRect {
  if (width <= 0 || height <= 0) throw new Error("Invalid image dimensions");

  const targetRatio = FACULTY_PHOTO_WIDTH / FACULTY_PHOTO_HEIGHT;
  const sourceRatio = width / height;

  if (sourceRatio > targetRatio) {
    const sw = height * targetRatio;
    return { sx: (width - sw) / 2, sy: 0, sw, sh: height };
  }

  const sh = width / targetRatio;
  return { sx: 0, sy: (height - sh) / 2, sw: width, sh };
}

function base64ToBytes(value: string): Uint8Array {
  const encoded = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  const decoded = atob(encoded);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function facultyPhotoTypeFromExtension(
  extension: string,
): FacultyPhotoContentType | null {
  const normalized = extension.toLowerCase();
  if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
  if (normalized === "png") return "image/png";
  return null;
}

export async function extractEmbeddedFacultyPhotos(
  workbookBuffer: ArrayBuffer,
): Promise<Map<number, EmbeddedFacultyPhoto>> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(workbookBuffer as never);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return new Map();

  let photoColumn = 0;
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    if (String(cell.value ?? "").trim() === FACULTY_PHOTO_HEADER) {
      photoColumn = columnNumber;
    }
  });
  if (!photoColumn) return new Map();

  const drawings = worksheet.getImages();
  if (drawings.length > MAX_FACULTY_PHOTOS_PER_WORKBOOK) {
    throw new Error(`Faculty workbook cannot contain more than ${MAX_FACULTY_PHOTOS_PER_WORKBOOK} photos`);
  }

  const photos = new Map<number, EmbeddedFacultyPhoto>();
  let totalPhotoBytes = 0;
  for (const drawing of drawings) {
    const rowNumber = Math.floor(drawing.range.tl.nativeRow) + 1;
    const columnNumber = Math.floor(drawing.range.tl.nativeCol) + 1;
    if (columnNumber !== photoColumn || rowNumber < 3) continue;
    if (photos.has(rowNumber)) {
      throw new Error(`Only one faculty photo is allowed in row ${rowNumber}`);
    }

    const image = workbook.getImage(Number(drawing.imageId));
    const contentType = facultyPhotoTypeFromExtension(String(image.extension));
    if (!contentType) {
      throw new Error(`Faculty photo in row ${rowNumber} must be JPG or PNG`);
    }

    const bytes = image.buffer
      ? new Uint8Array(image.buffer)
      : image.base64
        ? base64ToBytes(image.base64)
        : null;
    if (!bytes?.length) throw new Error(`Unable to read faculty photo in row ${rowNumber}`);
    if (bytes.length > MAX_FACULTY_PHOTO_BYTES) {
      throw new Error(`Faculty photo in row ${rowNumber} exceeds 8MB`);
    }
    totalPhotoBytes += bytes.length;
    if (totalPhotoBytes > MAX_TOTAL_FACULTY_PHOTO_BYTES) {
      throw new Error("Faculty workbook photos exceed the 25MB total limit");
    }

    photos.set(rowNumber, {
      bytes,
      contentType,
    });
  }

  return photos;
}

function canvasToBlob(canvas: HTMLCanvasElement, contentType: FacultyPhotoContentType): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Unable to resize faculty photo")),
      contentType,
      contentType === "image/jpeg" ? 0.88 : undefined,
    );
  });
}

export async function resizeFacultyPhoto(
  photo: EmbeddedFacultyPhoto,
): Promise<FacultyPhotoPayload> {
  const source = new Blob([photo.bytes as BlobPart], { type: photo.contentType });
  const objectUrl = URL.createObjectURL(source);
  const image = new Image();

  try {
    image.src = objectUrl;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > MAX_DECODED_FACULTY_PHOTO_PIXELS) {
      throw new Error("Faculty photo dimensions are too large");
    }
    const canvas = document.createElement("canvas");
    canvas.width = FACULTY_PHOTO_WIDTH;
    canvas.height = FACULTY_PHOTO_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable");

    const crop = getFourBySixCrop(image.naturalWidth, image.naturalHeight);
    context.drawImage(
      image,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      FACULTY_PHOTO_WIDTH,
      FACULTY_PHOTO_HEIGHT,
    );

    const resized = await canvasToBlob(canvas, photo.contentType);
    return {
      content_type: photo.contentType,
      data_base64: bytesToBase64(new Uint8Array(await resized.arrayBuffer())),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
