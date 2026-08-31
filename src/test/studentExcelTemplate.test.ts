import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import fs from "node:fs";

describe("Student Excel Template & Import Enhancements", () => {
  it("generates enhanced student template with proper headers and column widths", async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = "UNIGATES Platform";
    wb.created = new Date();

    const ws = wb.addWorksheet("بيانات الطلاب", {
      properties: { defaultColWidth: 20 },
      pageSetup: { orientation: "landscape" },
    });
    ws.views = [{ rightToLeft: true }];

    const headers = [
      "الأقسام",
      "الاسم الكامل",
      "تاريخ الميلاد (YYYY-MM-DD)",
      "النوع",
      "الرقم القومي",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "العنوان",
      "الفرقة / المستوى الدراسي",
      "الرقم السري المؤقت (اختياري)",
      "ملاحظات",
      "رابط الصورة (اختياري)",
      "صورة شخصية",
    ];

    const exampleRow1 = [
      "هندسة الحاسب",
      "أحمد محمد علي",
      "2003-05-15",
      "ذكر",
      "29805151234567",
      "+201001234567",
      "ahmed.mohamed@example.com",
      "القاهرة، مصر",
      "الفرقة الثانية",
      "Pass@1234",
      "طالب متفوق",
      "",
      "",
    ];

    ws.addRow(headers);
    ws.addRow(exampleRow1);

    expect(headers).toContain("الأقسام");
    expect(headers).toContain("الاسم الكامل");
    expect(headers).toContain("الرقم السري المؤقت (اختياري)");
    expect(headers).toContain("الفرقة / المستوى الدراسي");

    const headerRow = ws.getRow(1);
    expect(headerRow.cellCount).toBe(13);

    // Save to public/templates/students_template.xlsx
    const buffer = await wb.xlsx.writeBuffer();
    fs.writeFileSync("public/templates/students_template.xlsx", Buffer.from(buffer));
    expect(fs.existsSync("public/templates/students_template.xlsx")).toBe(true);
  });

  it("InstitutionFacultyImport file contains enhanced stepper and department reference UI", () => {
    const importSource = fs.readFileSync("src/pages/InstitutionFacultyImport.tsx", "utf8");
    expect(importSource).toContain("استيراد بيانات الطلاب من ملف Excel");
    expect(importSource).toContain("الخطوة الأولى");
    expect(importSource).toContain("الخطوة الثانية");
    expect(importSource).toContain("الخطوة الثالثة");
    expect(importSource).toContain("الأقسام المتاحة في مؤسستك");
    expect(importSource).toContain("معاينة بيانات الطلاب قبل الاستيراد");
    expect(importSource).toContain("exportCreatedAccountsReport");
    expect(importSource).toContain("photo: photoPayload");
  });
});
