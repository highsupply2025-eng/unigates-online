import { describe, expect, it } from "vitest";
import fs from "node:fs";
import ExcelJS from "exceljs";
import {
  FACULTY_PHOTO_HEADER,
  extractEmbeddedFacultyPhotos,
  facultyPhotoTypeFromExtension,
  getFourBySixCrop,
} from "@/lib/faculty-import-photo";

const importPage = fs.readFileSync("src/pages/InstitutionFacultyImport.tsx", "utf8");
const createFacultyFunction = fs.readFileSync(
  "supabase/functions/create-faculty-account/index.ts",
  "utf8",
);
const dashboard = fs.readFileSync("src/pages/InstitutionDashboard.tsx", "utf8");
const tinyPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=";

async function workbookWithImages(imageCount = 1): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Members");
  const headers = Array.from({ length: 14 }, (_, index) => index === 13 ? FACULTY_PHOTO_HEADER : `field_${index}`);
  worksheet.addRow(headers);
  worksheet.addRow(headers.map((_, index) => index === 13 ? "photo_image" : `key_${index}`));
  worksheet.addRow(["Faculty Member"]);

  for (let i = 0; i < imageCount; i++) {
    const imageId = workbook.addImage({ base64: tinyPng, extension: "png" });
    worksheet.addImage(imageId, {
      tl: { col: 13, row: 2 },
      ext: { width: 40, height: 60 },
    });
  }

  const output = await workbook.xlsx.writeBuffer();
  return new Uint8Array(output).slice().buffer;
}

describe("faculty Excel embedded photos", () => {
  it("ships the requested optional 4x6 photo column in the faculty template", async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fs.readFileSync("public/templates/faculty_members_template.xlsx") as never);
    const worksheet = workbook.worksheets[0];
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => headers.push(String(cell.value ?? "").trim()));

    expect(headers).toContain(FACULTY_PHOTO_HEADER);
    const photoColumn = headers.indexOf(FACULTY_PHOTO_HEADER) + 1;
    expect(worksheet.getCell(2, photoColumn).value).toBe("photo_image");
  });

  it("extracts a JPG or PNG anchored in the photo cell for its source row", async () => {
    const photos = await extractEmbeddedFacultyPhotos(await workbookWithImages());

    expect([...photos.keys()]).toEqual([3]);
    expect(photos.get(3)?.contentType).toBe("image/png");
    expect(photos.get(3)?.bytes.slice(0, 4)).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
  });

  it("rejects multiple embedded photos in one member row", async () => {
    await expect(extractEmbeddedFacultyPhotos(await workbookWithImages(2))).rejects.toThrow(
      "Only one faculty photo is allowed in row 3",
    );
  });

  it("center-crops landscape and tall images to a 2:3 portrait ratio", () => {
    expect(getFourBySixCrop(1200, 600)).toEqual({ sx: 400, sy: 0, sw: 400, sh: 600 });
    expect(getFourBySixCrop(400, 800)).toEqual({ sx: 0, sy: 100, sw: 400, sh: 600 });
  });

  it("accepts both JPG extension variants and PNG", () => {
    expect(facultyPhotoTypeFromExtension("jpg")).toBe("image/jpeg");
    expect(facultyPhotoTypeFromExtension("jpeg")).toBe("image/jpeg");
    expect(facultyPhotoTypeFromExtension("PNG")).toBe("image/png");
    expect(facultyPhotoTypeFromExtension("gif")).toBeNull();
  });

  it("passes resized photos to the secure account function and refreshes the faculty list", () => {
    expect(importPage).toContain("extractEmbeddedFacultyPhotos(buf)");
    expect(importPage).toContain("photo: photoPayload");
    expect(importPage).toContain('supabase.rpc("assign_faculty_department"');
    expect(importPage).toContain('sessionStorage.setItem("institution-dashboard-force-refresh"');
    expect(createFacultyFunction).toContain('"image/jpeg": "jpg"');
    expect(createFacultyFunction).toContain('"image/png": "png"');
    expect(createFacultyFunction).toContain('admin.storage.from("avatars").upload');
    expect(createFacultyFunction).toContain("extra.photo_url = photoUrl.publicUrl");
    expect(createFacultyFunction).toContain('admin.storage.from("avatars").remove');
    expect(createFacultyFunction).toContain("Faculty photo must be resized to 400x600 pixels");
    expect(dashboard).toContain('<img src={m.photo_url} alt={m.full_name}');
  });
});
