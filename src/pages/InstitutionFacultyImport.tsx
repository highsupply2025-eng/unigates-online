import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft, ArrowRight, Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import {
  extractEmbeddedFacultyPhotos,
  MAX_FACULTY_WORKBOOK_BYTES,
  resizeFacultyPhoto,
  STUDENT_PHOTO_HEADER,
  type EmbeddedFacultyPhoto,
  type FacultyPhotoPayload,
} from "@/lib/faculty-import-photo";

const ROLE_MAP: Record<string, string> = {
  "عميد الكلية": "dean", "مدير المعهد": "dean", "dean": "dean", "Dean": "dean",
  "وكيل الكلية للدراسات العليا": "vice_dean_postgrad", "وكيل المعهد للدراسات العليا": "vice_dean_postgrad", "vice_dean_postgrad": "vice_dean_postgrad", "Vice Dean - Postgraduate Studies": "vice_dean_postgrad",
  "وكيل الكلية لشئون الطلاب": "vice_dean_students", "وكيل المعهد لشئون الطلاب": "vice_dean_students", "vice_dean_students": "vice_dean_students", "Vice Dean - Student Affairs": "vice_dean_students",
  "وكيل الكلية لشئون البيئة وخدمة المجتمع": "vice_dean_community", "وكيل المعهد لشئون البيئة وخدمة المجتمع": "vice_dean_community", "vice_dean_community": "vice_dean_community", "Vice Dean - Environment & Community Service": "vice_dean_community",
  "رئيس القسم": "department_head", "department_head": "department_head", "Department Head": "department_head",
  "teaching_assistant": "teaching_assistant",
  "مدرس مساعد": "teaching_assistant",
  "Teaching Assistant": "teaching_assistant",
  "أستاذ دكتور": "professor", "professor": "professor", "Professor": "professor",
  "دكتور": "doctor", "doctor": "doctor", "Doctor": "doctor",
  "معيد": "assistant_lecturer", "assistant_lecturer": "assistant_lecturer", "Assistant Lecturer": "assistant_lecturer",
};

const FACULTY_ROLE_OPTIONS = [
  { value: "dean", ar: "عميد الكلية", en: "Dean" },
  { value: "vice_dean_postgrad", ar: "وكيل الكلية للدراسات العليا", en: "Vice Dean - Postgraduate Studies" },
  { value: "vice_dean_students", ar: "وكيل الكلية لشئون الطلاب", en: "Vice Dean - Student Affairs" },
  { value: "vice_dean_community", ar: "وكيل الكلية لشئون البيئة وخدمة المجتمع", en: "Vice Dean - Environment & Community Service" },
  { value: "department_head", ar: "رئيس القسم", en: "Department Head" },
  { value: "teaching_assistant", ar: "مدرس مساعد", en: "Teaching Assistant" },
  { value: "professor", ar: "أستاذ دكتور", en: "Professor" },
  { value: "doctor", ar: "دكتور", en: "Doctor" },
  { value: "assistant_lecturer", ar: "معيد", en: "Assistant Lecturer" },
];

const InstitutionFacultyImport = () => {
  const { language, dir } = useLanguage();
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStudent = searchParams.get("role") === "student";
  const fileRef = useRef<HTMLInputElement>(null);
  const { identity, loading: identityLoading } = useInstitutionIdentity();

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; skipped: number; failed: number; errors: string[] } | null>(null);

  const institutionId = identity?.institutionId ?? "";
  const institutionType = identity?.institutionType ?? null;

  useEffect(() => {
    if (!identity) return;
    (async () => {
      try {
        const { data: depts } = await supabase.from("departments").select("id, department_name").eq("institution_id", identity.institutionId).eq("institution_type", identity.institutionType);
        setDepartments((depts || []).map((d: any) => ({ id: d.id, name: d.department_name })));
      } finally {
        setLoading(false);
      }
    })();
  }, [identity]);

  const norm = (v: any) => (v == null ? "" : String(v).trim());

  const generateStudentTemplate = useCallback(async () => {
    const isEn = language === "en";
    const wb = new ExcelJS.Workbook();
    wb.creator = "UNIGATES";
    wb.created = new Date();

    const ws = wb.addWorksheet(isEn ? "Data" : "البيانات", {
      properties: { defaultColWidth: 18 },
      pageSetup: { orientation: "landscape" },
    });
    ws.views = [{ rightToLeft: !isEn }];

    const headers = isEn
      ? [
          "Departments",
          "Full Name",
          "Date of Birth (YYYY-MM-DD)",
          "Gender",
          "National ID",
          "Phone",
          "Email",
          "Address",
          "Qualification",
          "Notes",
          "Photo URL (optional)",
          "Photo Image",
        ]
      : [
      "الأقسام",
      "الاسم الكامل",
      "تاريخ الميلاد (YYYY-MM-DD)",
      "النوع",
      "الرقم القومي",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "العنوان",
      "المؤهل الدراسي",
      "ملاحظات",
      "رابط الصورة (اختياري)",
      "صورة شخصية",
    ];
    const exampleRow = isEn
      ? [
          "Computer Engineering",
          "Ahmed Mohamed Ali",
          "2002-05-15",
          "male",
          "29805151234567",
          "+201001234567",
          "ahmed@example.com",
          "Cairo, Egypt",
          "Second Year",
          "",
          "",
          "",
        ]
      : [
          "هندسة الحاسب",
          "أحمد محمد علي",
          "2002-05-15",
          "ذكر",
          "29805151234567",
          "+201001234567",
          "ahmed@example.com",
          "القاهرة، مصر",
          "الفرقة الثانية",
          "",
          "",
          "",
        ];

    ws.addRow(headers);
    ws.addRow(exampleRow);

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF16A34A" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF15803D" } },
      };
    });

    ws.getColumn(1).width = 28;  // الأقسام
    ws.getColumn(2).width = 24;  // الاسم الكامل
    ws.getColumn(3).width = 24;  // تاريخ الميلاد
    ws.getColumn(4).width = 10;  // النوع
    ws.getColumn(5).width = 18;  // الرقم القومي
    ws.getColumn(6).width = 18;  // رقم الهاتف
    ws.getColumn(7).width = 28;  // البريد الإلكتروني
    ws.getColumn(8).width = 22;  // العنوان
    ws.getColumn(9).width = 18;  // المؤهل الدراسي
    ws.getColumn(10).width = 20; // ملاحظات
    ws.getColumn(11).width = 32; // رابط الصورة
    ws.getColumn(12).width = 18; // صورة شخصية

    // --- Sheet 2: Instructions ---
    const stdInstrName = isEn ? "Instructions" : "تعليمات تعبئة ملف الطلاب";
    const is = wb.addWorksheet(stdInstrName, {
      properties: { defaultColWidth: 20 },
    });
    is.views = [{ rightToLeft: !isEn }];

    is.mergeCells("A1:F1");
    const titleCell = is.getCell("A1");
    titleCell.value = isEn ? "Student Registration Template Instructions" : "تعليمات تعبئة ملف تسجيل الطلاب";
    titleCell.font = { bold: true, size: 16, color: { argb: "FF16A34A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0FDF4" },
    };
    is.getRow(1).height = 36;

    is.addRow([]);

    const instructions = isEn
      ? [
          "1. Do not modify the header row (row 1).",
          "2. Start entering data from row 2.",
          "3. Enter the department name as registered in the dashboard (case-insensitive).",
          "4. To register a student in multiple departments, separate names with commas in the same cell. e.g. Computer Engineering, Computer Science",
          "5. You can also use department codes instead of names.",
          "6. Only Full Name and Department are required fields.",
          "7. Date of birth in YYYY-MM-DD format (e.g. 2002-05-15).",
          "8. Gender: male or female.",
          "9. Photo is optional — insert a JPG or PNG into the 'Photo Image' cell for that student.",
          "10. You can also enter an external photo URL in the 'Photo URL (optional)' column.",
          "11. Use XLSX format for embedded photos; legacy XLS files import text data only.",
        ]
      : [
          "1. لا تُغيّر صف العناوين (صف 1).",
          "2. ابدأ إدخال البيانات من الصف 2.",
          "3. يجب إدخال اسم القسم كما هو مسجل في لوحة الإدارة (مطابقة غير حساسة لحالة الأحرف).",
          "4. لتسجيل الطالب لأكثر من قسم، افصل الأسماء بفاصلة في نفس الخلية. مثال: هندسة الحاسب, علوم الحاسب",
          "5. يمكنك أيضًا استخدام أكواد الأقسام بدل الأسماء.",
          "6. الاسم الكامل والقسم فقط هما الحقول المطلوبة.",
          "7. تاريخ الميلاد بصيغة YYYY-MM-DD (مثال: 2002-05-15).",
          "8. النوع: ذكر أو أنثى.",
          "9. الصورة الشخصية اختيارية — أدرج صورة JPG أو PNG داخل خلية «صورة شخصية» في صف الطالب.",
          "10. يمكنك أيضًا إدخال رابط صورة خارجي في عمود «رابط الصورة (اختياري)».",
          "11. استخدم صيغة XLSX عند إدراج الصور؛ ملفات XLS القديمة تستورد البيانات النصية فقط.",
        ];
    instructions.forEach((line) => is.addRow([line]));

    is.addRow([]);
    is.addRow([isEn ? "Required Columns:" : "الأعمدة المطلوبة:"]);
    is.getRow(is.rowCount).font = { bold: true, size: 12 };

    const colHeaders = isEn
      ? [
          ["Departments", "Department name or codes (required)"],
          ["Full Name", "Full name of the student (required)"],
          ["Date of Birth", "YYYY-MM-DD format"],
          ["Gender", "male or female"],
          ["National ID", "National identity number"],
          ["Phone", "Phone number with country code"],
          ["Email", "Personal email address"],
          ["Address", "Full address"],
          ["Qualification", "e.g. Second Year"],
          ["Notes", "Any additional notes"],
          ["Photo URL", "URL to a photo online (optional)"],
          ["Photo Image", "Image embedded in Excel cell (optional)"],
        ]
      : [
          ["الأقسام", "اسم القسم أو أكواد الأقسام (مطلوب)"],
          ["الاسم الكامل", "الاسم الرباعي للطالب (مطلوب)"],
          ["تاريخ الميلاد", "بصيغة YYYY-MM-DD"],
          ["النوع", "ذكر أو أنثى"],
          ["الرقم القومي", "رقم الهوية الوطنية"],
          ["رقم الهاتف", "رقم الهاتف مع رمز الدولة"],
          ["البريد الإلكتروني", "البريد الإلكتروني الشخصي"],
          ["العنوان", "العنوان التفصيلي"],
          ["المؤهل الدراسي", "مثال: الفرقة الثانية"],
          ["ملاحظات", "أي ملاحظات إضافية"],
          ["رابط الصورة", "رابط صورة شخصية على الإنترنت (اختياري)"],
          ["صورة شخصية", "صورة مُضمنة داخل خلية Excel (اختياري)"],
        ];
    colHeaders.forEach((row) => is.addRow(row));

    // Style instruction header column
    const instructionColA = is.getColumn(1);
    instructionColA.width = 26;
    const instructionColB = is.getColumn(2);
    instructionColB.width = 55;

    is.addRow([]);
    is.addRow([isEn ? "Example:" : "مثال:"]);
    is.getRow(is.rowCount).font = { bold: true, size: 12 };
    is.addRow([isEn ? "Departments" : "الأقسام", isEn ? "Computer Engineering" : "هندسة الحاسب"]);
    is.addRow([isEn ? "Full Name" : "الاسم الكامل", isEn ? "Ahmed Mohamed Ali" : "أحمد محمد علي"]);
    is.addRow([isEn ? "Date of Birth" : "تاريخ الميلاد", "2002-05-15"]);
    is.addRow([isEn ? "Gender" : "النوع", isEn ? "male" : "ذكر"]);

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isEn ? "students_template_en.xlsx" : "students_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [language]);

  const generateFacultyTemplate = useCallback(async () => {
    const isEn = language === "en";

    const wb = new ExcelJS.Workbook();
    wb.creator = "UNIGATES";
    wb.created = new Date();

    const ws = wb.addWorksheet(isEn ? "Members" : "الأعضاء", {
      properties: { defaultColWidth: 18 },
      pageSetup: { orientation: "landscape" },
    });
    ws.views = [{ rightToLeft: !isEn }];

    const headers = isEn
      ? [
          "Full Name",
          "Role",
          "Department",
          "Date of Birth (YYYY-MM-DD)",
          "Gender",
          "National ID",
          "Email",
          "Phone",
          "Address",
          "Qualification",
          "Specialization",
          "Hire Date (YYYY-MM-DD)",
          "Notes",
          "Photo URL (optional)",
          "Photo Image 4×6",
        ]
      : [
          "الاسم الكامل",
          "الوظيفة",
          "القسم",
          "تاريخ الميلاد (YYYY-MM-DD)",
          "النوع",
          "الرقم القومي",
          "البريد الإلكتروني",
          "رقم الهاتف",
          "العنوان",
          "المؤهل العلمي",
          "التخصص",
          "تاريخ التعيين (YYYY-MM-DD)",
          "ملاحظات",
          "رابط الصورة (اختياري)",
          "صورة شخصية 4×6",
        ];
    const exampleRow = isEn
      ? [
          "Ahmed Mohamed Ali",
          "Doctor",
          "Computer Science Department",
          "1985-05-12",
          "male",
          "29001011234567",
          "ahmed@example.com",
          "01000000000",
          "Cairo",
          "PhD",
          "Artificial Intelligence",
          "2020-09-01",
          "",
          "https://example.com/photo.jpg",
          "",
        ]
      : [
          "أحمد محمد علي",
          "دكتور",
          "قسم علوم الحاسب",
          "1985-05-12",
          "male",
          "29001011234567",
          "ahmed@example.com",
          "01000000000",
          "القاهرة",
          "دكتوراه",
          "ذكاء اصطناعي",
          "2020-09-01",
          "",
          "https://example.com/photo.jpg",
          "",
        ];

    ws.addRow(headers);
    ws.addRow(exampleRow);

    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF16A34A" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF15803D" } },
      };
    });

    ws.getColumn(1).width = 24;  // Full Name
    ws.getColumn(2).width = 30;  // Role (wider for dropdown)
    ws.getColumn(3).width = 24;  // Department
    ws.getColumn(4).width = 24;  // Date of Birth
    ws.getColumn(5).width = 10;  // Gender
    ws.getColumn(6).width = 18;  // National ID
    ws.getColumn(7).width = 28;  // Email
    ws.getColumn(8).width = 18;  // Phone
    ws.getColumn(9).width = 22;  // Address
    ws.getColumn(10).width = 18; // Qualification
    ws.getColumn(11).width = 18; // Specialization
    ws.getColumn(12).width = 24; // Hire Date
    ws.getColumn(13).width = 20; // Notes
    ws.getColumn(14).width = 32; // Photo URL
    ws.getColumn(15).width = 18; // Photo Image

    // --- Data Validation: Role dropdown (column 2, rows 2–1000) ---
    const roleList = FACULTY_ROLE_OPTIONS.map((r) => r[isEn ? "en" : "ar"]).join(",");
    for (let row = 2; row <= 1000; row++) {
      ws.getCell(row, 2).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${roleList}"`],
        showErrorMessage: true,
        errorTitle: isEn ? "Invalid Role" : "وظيفة غير صحيحة",
        error: isEn
          ? "Please select a role from the dropdown list."
          : "يرجى اختيار مسمى وظيفي من القائمة المنسدلة.",
      };
    }

    // --- Sheet 2: Instructions ---
    const instrSheetName = isEn ? "Instructions" : "تعليمات";
    const isSheet = wb.addWorksheet(instrSheetName, {
      properties: { defaultColWidth: 20 },
    });
    isSheet.views = [{ rightToLeft: !isEn }];

    isSheet.mergeCells("A1:F1");
    const titleCell = isSheet.getCell("A1");
    titleCell.value = isEn
      ? "Instructions for Faculty Import Template"
      : "تعليمات تعبئة ملف إضافة الأعضاء";
    titleCell.font = { bold: true, size: 16, color: { argb: "FF16A34A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0FDF4" },
    };
    isSheet.getRow(1).height = 36;

    isSheet.addRow([]);

    const instructions = isEn
      ? [
          "1. Do not modify the header row (row 1).",
          "2. Start entering data from row 2.",
          "3. Required fields: Full Name, Role. Department is optional.",
          "4. Role must be selected from the dropdown list in the template.",
          "5. Gender: male or female.",
          "6. Dates must be in YYYY-MM-DD format.",
          "7. National ID, Email, and Phone are optional but recommended.",
          "8. Hire Date is optional — use YYYY-MM-DD format.",
          "9. Photo URL is optional.",
          "10. Photo Image is optional — insert a JPG or PNG into the 'Photo Image 4×6' cell.",
          "11. Use XLSX format for embedded photos; legacy XLS files import text data only.",
        ]
      : [
          "1. لا تُغيّر صف العناوين (صف 1).",
          "2. ابدأ إدخال البيانات من الصف 2.",
          "3. الحقول المطلوبة: الاسم الكامل، الوظيفة. القسم اختياري.",
          "4. يجب أن تكون الوظيفة من القائمة المنسدلة في القالب.",
          "5. النوع: male أو female.",
          "6. التواريخ بصيغة YYYY-MM-DD.",
          "7. الرقم القومي والبريد الإلكتروني ورقم الهاتف اختيارية لكن مفضّلة.",
          "8. تاريخ التعيين اختياري — بصيغة YYYY-MM-DD.",
          "9. رابط الصورة اختياري.",
          "10. صورة شخصية اختيارية — أدرج صورة JPG أو PNG داخل خلية «صورة شخصية 4×6».",
          "11. استخدم صيغة XLSX عند إدراج الصور؛ ملفات XLS القديمة تستورد البيانات النصية فقط.",
        ];
    instructions.forEach((line) => isSheet.addRow([line]));

    isSheet.addRow([]);
    isSheet.addRow([isEn ? "Required Columns:" : "الأعمدة المطلوبة:"]);
    isSheet.getRow(isSheet.rowCount).font = { bold: true, size: 12 };

    const colHeaders = isEn
      ? [
          ["Full Name", "Full name (required)"],
          ["Role", "Job title (required) — e.g. Professor"],
          ["Department", "Department name from the dashboard"],
          ["Date of Birth", "YYYY-MM-DD format"],
          ["Gender", "male or female"],
          ["National ID", "National identity number"],
          ["Email", "Personal email address"],
          ["Phone", "Phone number with country code"],
          ["Address", "Full address"],
          ["Qualification", "e.g. PhD"],
          ["Specialization", "e.g. Artificial Intelligence"],
          ["Hire Date", "YYYY-MM-DD format — optional"],
          ["Notes", "Any additional notes"],
          ["Photo URL", "URL to a photo online (optional)"],
          ["Photo Image 4×6", "Image embedded in Excel cell (optional)"],
        ]
      : [
          ["الاسم الكامل", "الاسم الرباعي (مطلوب)"],
          ["الوظيفة", "المسمى الوظيفي (مطلوب) — مثال: أستاذ دكتور"],
          ["القسم", "اسم القسم الموجود في لوحة الإدارة"],
          ["تاريخ الميلاد", "بصيغة YYYY-MM-DD"],
          ["النوع", "male أو female"],
          ["الرقم القومي", "رقم الهوية الوطنية"],
          ["البريد الإلكتروني", "البريد الإلكتروني الشخصي"],
          ["رقم الهاتف", "رقم الهاتف مع رمز الدولة"],
          ["العنوان", "العنوان التفصيلي"],
          ["المؤهل العلمي", "مثال: دكتوراه"],
          ["التخصص", "مثال: ذكاء اصطناعي"],
          ["تاريخ التعيين", "بصيغة YYYY-MM-DD — اختياري"],
          ["ملاحظات", "أي ملاحظات إضافية"],
          ["رابط الصورة", "رابط صورة شخصية على الإنترنت (اختياري)"],
          ["صورة شخصية 4×6", "صورة مُضمنة داخل خلية Excel (اختياري)"],
        ];
    colHeaders.forEach((row) => isSheet.addRow(row));

    const instructionColA = isSheet.getColumn(1);
    instructionColA.width = 26;
    const instructionColB = isSheet.getColumn(2);
    instructionColB.width = 55;

    isSheet.addRow([]);
    isSheet.addRow([isEn ? "Example:" : "مثال:"]);
    isSheet.getRow(isSheet.rowCount).font = { bold: true, size: 12 };
    isSheet.addRow([isEn ? "Full Name" : "الاسم الكامل", isEn ? "Ahmed Mohamed Ali" : "أحمد محمد علي"]);
    isSheet.addRow([isEn ? "Role" : "الوظيفة", isEn ? "Doctor" : "دكتور"]);
    isSheet.addRow([isEn ? "Department" : "القسم", isEn ? "Computer Science Department" : "قسم علوم الحاسب"]);
    isSheet.addRow([isEn ? "Date of Birth" : "تاريخ الميلاد", "1985-05-12"]);
    isSheet.addRow([isEn ? "Gender" : "النوع", "male"]);
    isSheet.addRow([isEn ? "Hire Date" : "تاريخ التعيين", "2020-09-01"]);

    // --- Role values list sheet (hidden, for Data Validation source) ---
    const roleSheet = wb.addWorksheet("_roles");
    roleSheet.views = [{ rightToLeft: !isEn }];
    FACULTY_ROLE_OPTIONS.forEach((r, idx) => {
      roleSheet.getCell(idx + 1, 1).value = r[isEn ? "en" : "ar"];
    });
    roleSheet.state = "hidden";

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isEn ? "faculty_members_template_en.xlsx" : "faculty_members_template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [language]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      if (!isStudent && file.size > MAX_FACULTY_WORKBOOK_BYTES) {
        throw new Error(isRtl ? "حجم ملف Excel أكبر من 20MB" : "Excel file exceeds 20MB");
      }
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const embeddedPhotos = file.name.toLowerCase().endsWith(".xlsx")
        ? await extractEmbeddedFacultyPhotos(buf, isStudent ? STUDENT_PHOTO_HEADER : undefined)
        : new Map<number, EmbeddedFacultyPhoto>();

      // Data rows start at row 2 (row 1 is the header)
      const data = rows.filter(r => {
        const fn = norm(r["الاسم الكامل"] || r["full_name"]);
        return fn;
      });

      if (data.length === 0) throw new Error(isRtl ? "الملف فارغ" : "Empty file");

      const deptByName = new Map(departments.map(d => [d.name.trim().toLowerCase(), d.id]));

      // For student import, also fetch all department codes for lookup
      const deptByCode = new Map<string, string>();
      if (isStudent) {
        const { data: allDepts } = await supabase
          .from("departments")
          .select("id, department_code, department_name");
        (allDepts || []).forEach((d: any) => {
          if (d.department_code) deptByCode.set(String(d.department_code).toUpperCase(), d.id);
          if (d.department_name) deptByName.set(String(d.department_name).trim().toLowerCase(), d.id);
        });
      }

      
      let success = 0, failed = 0, skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        const sourceRow = typeof r.__rowNum__ === "number" ? r.__rowNum__ + 1 : i + 2;
        const full_name = norm(r["الاسم الكامل"] || r["full_name"]);
        const roleRaw = norm(r["الوظيفة"] || r["role"]);
        const role = isStudent ? "student" : (ROLE_MAP[roleRaw] || ROLE_MAP[roleRaw.toLowerCase()]);

        // For students: resolve target departments by name or code(s) — may be multiple, comma-separated
        let targetDeptIds: string[] = [];
        let unmatchedDeptNames: string[] = [];
        if (isStudent) {
          const deptRaw = norm(r["الأقسام"] || r["القسم"] || r["department"] || r["departments"] || r["كود القسم"] || r["أكواد الأقسام"] || r["department_code"] || r["dept_code"]);
          const parts = deptRaw.split(/[\s,،]+/).map(c => c.trim()).filter(Boolean);
          for (const part of parts) {
            const upper = part.toUpperCase();
            const lower = part.toLowerCase();
            const byCode = deptByCode.get(upper);
            const byName = deptByName.get(lower);
            if (byCode) {
              targetDeptIds.push(byCode);
            } else if (byName) {
              targetDeptIds.push(byName);
            } else {
              unmatchedDeptNames.push(part);
            }
          }
          targetDeptIds = [...new Set(targetDeptIds)];
          if (unmatchedDeptNames.length > 0) {
            errors.push(
              `${isRtl ? "صف" : "Row"} ${i + 2}: ${
                isRtl
                  ? `أقسام غير معروفة: ${unmatchedDeptNames.join(", ")}`
                  : `Unknown departments: ${unmatchedDeptNames.join(", ")}`
              }`,
            );
          }
          if (targetDeptIds.length === 0) {
            failed++;
            errors.push(`${isRtl ? "صف" : "Row"} ${i + 2}: ${isRtl ? "القسم مفقود أو غير صالح" : "missing or invalid department"}`);
            continue;
          }
        } else {
  const deptName = norm(r["القسم"] || r["department"]);
  const dId = deptName ? deptByName.get(deptName) : undefined;

  if (dId) {
    targetDeptIds = [dId];
  }
}

       if (
  !full_name ||
  !role ||
  (isStudent && targetDeptIds.length === 0)
) {
  failed++;

  errors.push(
    `${isRtl ? "صف" : "Row"} ${i + 2}: ${
      !full_name
        ? isRtl
          ? "اسم مفقود"
          : "missing name"
        : !role
          ? isRtl
            ? "وظيفة غير صحيحة"
            : "invalid role"
          : isRtl
            ? "لا يوجد قسم"
            : "no department"
    }`,
  );

  continue;
}

        let photoPayload: FacultyPhotoPayload | undefined;
        let resolvedPhotoUrl: string | null = null;

        // 1. Try embedded image from Excel cell
        const embeddedPhoto = embeddedPhotos.get(sourceRow);
        if (embeddedPhoto) {
          try {
            photoPayload = await resizeFacultyPhoto(embeddedPhoto);
          } catch (photoError) {
            errors.push(
              `${isRtl ? "صف" : "Row"} ${sourceRow}: ${
                photoError instanceof Error
                  ? photoError.message
                  : isRtl
                    ? "تعذر معالجة الصورة الشخصية — تم استبعادها"
                    : "Unable to process faculty photo — skipped"
              }`,
            );
          }
        }

        // 2. Try photo_url from Excel — download and upload to storage
        const rawPhotoUrl = norm(r["رابط الصورة (اختياري)"] || r["رابط الصورة"] || r["photo_url"]);
        if (!photoPayload && rawPhotoUrl && /^https?:\/\//i.test(rawPhotoUrl)) {
          try {
            const resp = await fetch(rawPhotoUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              const ext = rawPhotoUrl.split(/[?#]/)[0].split(".").pop()?.toLowerCase() || "jpg";
              const contentType = ext === "png" ? "image/png" : "image/jpeg";
              const path = `faculty-photos/${crypto.randomUUID()}.${ext}`;
              const { error: uploadErr } = await supabase.storage
                .from("avatars")
                .upload(path, blob, { contentType, upsert: false });
              if (!uploadErr) {
                const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
                resolvedPhotoUrl = urlData.publicUrl;
              }
            }
          } catch (urlPhotoErr) {
            errors.push(
              `${isRtl ? "صف" : "Row"} ${sourceRow}: ${
                isRtl
                  ? "تعذر تحميل الصورة من الرابط — تم تخطيها"
                  : "Unable to load photo from URL — skipped"
              }`,
            );
          }
        }

        const baseRow = {
          full_name,
          role,
          date_of_birth: norm(r["تاريخ الميلاد (YYYY-MM-DD)"] || r["تاريخ الميلاد"] || r["date_of_birth"]) || null,
          email: norm(r["البريد الإلكتروني"] || r["email"]) || null,
          phone: norm(r["رقم الهاتف"] || r["phone"]) || null,
          national_id: norm(r["الرقم القومي"] || r["national_id"]) || null,
          gender: norm(r["النوع"] || r["gender"]) || null,
          address: norm(r["العنوان"] || r["address"]) || null,
          qualification: norm(r["المؤهل الدراسي"] || r["المؤهل العلمي"] || r["qualification"]) || null,
          specialization: isStudent ? null : (norm(r["التخصص"] || r["specialization"]) || null),
          hire_date: isStudent ? null : (norm(r["تاريخ التعيين (YYYY-MM-DD)"] || r["تاريخ التعيين"] || r["hire_date"]) || null),
          notes: norm(r["ملاحظات"] || r["notes"]) || null,
          photo_url: resolvedPhotoUrl || rawPhotoUrl || null,
        };

        let insertError: any = null;

if (isStudent) {
  const rows = targetDeptIds.map((department_id) => ({
    ...baseRow,
    department_id,
    invitation_code:
      `STU-${Date.now().toString(36).toUpperCase()}-${crypto
        .getRandomValues(new Uint32Array(1))[0]
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
  }));

  const { error } = await supabase
    .from("department_members")
    .insert(rows);

  insertError = error;
} else {
  if (!institutionId || !institutionType) {
    insertError = new Error(
      isRtl
        ? "تعذر تحديد الكلية أو المعهد"
        : "Unable to determine institution",
    );
  } else {
    // Faculty rows require an auth user (institution_faculty_members.user_id
    // is NOT NULL). Route through the edge function so each row gets an
    // auth account, profile, role, and institution membership atomically.
    const { generateStrongPassword } = await import("@/utils/crypto");
    const tempPassword = `Tmp${generateStrongPassword()}!`;
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      "create-faculty-account",
      {
        body: {
          full_name: baseRow.full_name,
          role: baseRow.role,
          email: baseRow.email || undefined,
          phone: baseRow.phone || undefined,
          temporary_password: tempPassword,
          photo: photoPayload,
          extra: {
            date_of_birth: baseRow.date_of_birth,
            photo_url: baseRow.photo_url,
            national_id: baseRow.national_id,
            gender: baseRow.gender,
            address: baseRow.address,
            qualification: baseRow.qualification,
            specialization: baseRow.specialization,
            hire_date: baseRow.hire_date,
            notes: baseRow.notes,
          },
        },
      },
    );
    // Parse the real error body from a non-2xx response
    let errBody: any = null;
    if (fnError) {
      try {
        const ctx: any = (fnError as any).context;
        if (ctx && typeof ctx.json === "function") errBody = await ctx.json();
      } catch { /* ignore */ }
    } else if (fnData && (fnData as any).success === false) {
      errBody = fnData;
    }

    const errStep = errBody?.step as string | undefined;
    const errMsg = errBody?.error || fnError?.message;

    // Idempotency: an existing account/faculty row is not a failure — skip it.
    if (errStep === "faculty_email_exists" || errStep === "auth_email_exists") {
      skipped++;
      errors.push(
        `${isRtl ? "صف" : "Row"} ${i + 2}: ${
          isRtl
            ? `البريد «${baseRow.email}» مسجّل مسبقاً — تم التخطي`
            : `Email "${baseRow.email}" already registered — skipped`
        }`,
      );
      continue;
    }

    if (errBody || fnError) {
      insertError = new Error(errMsg || "create-faculty-account failed");
    } else if (targetDeptIds.length > 0 && fnData && (fnData as any).user_id) {
      // Optional department assignment
      const { error: assignErr } = await supabase.rpc("assign_faculty_department", {
        p_user_id: (fnData as any).user_id,
        p_new_department_id: targetDeptIds[0],
        p_specific_role: baseRow.role,
        p_full_name: baseRow.full_name,
        p_email: (fnData as any).email || baseRow.email || null,
        p_phone: baseRow.phone,
      });
      if (assignErr) insertError = assignErr;
    }
  }
}

if (insertError) {
  failed++;

  errors.push(
    `${isRtl ? "صف" : "Row"} ${i + 2}: ${insertError.message}`,
  );
} else {
  success++;
}
      }

      if (success > 0) {
        try {
          sessionStorage.setItem("institution-dashboard-force-refresh", Date.now().toString());
        } catch { /* ignore */ }
      }
      setResult({ success, skipped, failed, errors: errors.slice(0, 20) });
      const descParts: string[] = [];
      if (skipped > 0) descParts.push(isRtl ? `${skipped} تم التخطي (موجود مسبقاً)` : `${skipped} skipped (already exists)`);
      if (failed > 0) descParts.push(isRtl ? `${failed} فشل` : `${failed} failed`);
      toast({
        title: isRtl ? `تمت إضافة ${success} عضو` : `Added ${success} members`,
        description: descParts.join(" • ") || undefined,
        variant: failed > 0 && success === 0 ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({ title: isRtl ? "فشل المعالجة" : "Processing failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-background via-background to-emerald-500/5">
      <header className="border-b bg-gradient-to-l from-emerald-500/10 via-card to-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <span className="truncate">{isStudent ? (isRtl ? "رفع بيانات الطلاب" : "Upload Students File") : (isRtl ? "رفع ملف Excel" : "Upload Excel File")}</span>
          </h1>
          <Button size="icon" variant="default" className="shadow-md shrink-0" onClick={() => navigate(-1)} aria-label={isRtl ? "رجوع" : "Back"}>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="border-2 border-emerald-500/20 max-w-3xl mx-auto">
          <CardContent className="p-6 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-10 h-10 text-white" strokeWidth={2.4} />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">{isRtl ? "رفع ملف Excel" : "Upload Excel File"}</h2>
            <p className="text-muted-foreground mb-6">
              {isRtl ? "حمّل القالب، عبّئ البيانات، ثم ارفع الملف لإضافة الأعضاء دفعة واحدة." : "Download the template, fill in data, then upload to bulk-add members."}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {isStudent ? (
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white shadow-md"
                  onClick={generateStudentTemplate}
                >
                  <Download className="w-5 h-5" />
                  {isRtl ? "تحميل قالب الطلاب" : "Download Student Template"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white shadow-md"
                  onClick={generateFacultyTemplate}
                >
                  <Download className="w-5 h-5" />
                  {isRtl ? "تحميل قالب Excel" : "Download Template"}
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 border-2 border-emerald-500/40 hover:bg-emerald-500/5"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploading ? (isRtl ? "جارٍ المعالجة..." : "Processing...") : (isRtl ? "رفع الملف" : "Upload File")}
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
            </div>

            {result && (
              <div className="mt-6 text-start space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold">{isRtl ? `تم إضافة ${result.success} عضو بنجاح` : `${result.success} members added`}</span>
                </div>
                {result.skipped > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-bold">
                      {isRtl ? `${result.skipped} تم التخطي (موجود مسبقاً)` : `${result.skipped} skipped (already exists)`}
                    </span>
                  </div>
                )}
                {(result.failed > 0 || result.errors.length > 0) && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                    {result.failed > 0 && (
                      <div className="flex items-center gap-2 font-bold text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        {isRtl ? `${result.failed} صف فشل` : `${result.failed} rows failed`}
                      </div>
                    )}
                    <ul className="text-sm text-muted-foreground list-disc ps-5">
                      {result.errors.map((er, i) => <li key={i}>{er}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 text-start bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm">
              <h3 className="font-bold mb-2 text-emerald-700 dark:text-emerald-400">
                {isRtl ? "ملاحظات هامة:" : "Important notes:"}
              </h3>
              <ul className="text-muted-foreground list-disc ps-5 space-y-1">
                {!isStudent && <li>{isRtl ? "الوظيفة يجب أن تكون من القائمة المنسدلة في القالب." : "Role must be from the template dropdown."}</li>}
                {!isStudent && <li>{isRtl ? "الصورة الشخصية اختيارية. أدرج صورة JPG أو PNG واحدة داخل خلية «صورة شخصية 4×6» في صف العضو." : "Photo is optional. Insert one JPG or PNG into the 'صورة شخصية 4×6' cell for that member."}</li>}
                {!isStudent && <li>{isRtl ? "استخدم صيغة XLSX عند إدراج الصور؛ ملفات XLS القديمة ستستورد البيانات النصية فقط." : "Use XLSX for embedded photos; legacy XLS files import text data only."}</li>}
                {isStudent ? (
                  <>
                    <li>{isRtl ? "أضف عمود «القسم» في الملف باسم القسم الموجود في لوحة الإدارة (مطابقة غير حساسة لحالة الأحرف)." : "Add a 'القسم' column with the department name from the dashboard (case-insensitive matching)."}</li>
                    <li>{isRtl ? "لإضافة الطالب لأكثر من قسم، افصل الأسماء بفاصلة في نفس الخلية. مثال: هندسة الحاسب, علوم الحاسب" : "To enroll a student in multiple departments, separate names with commas in the same cell. e.g. Computer Engineering, Computer Science"}</li>
                    <li>{isRtl ? "يمكنك أيضًا استخدام أكواد الأقسام بدل الأسماء." : "You can also use department codes instead of names."}</li>
                    <li>{isRtl ? "الحقول المطلوبة: الاسم والقسم." : "Required: name and department."}</li>
                  </>
                ) : (
                  <li>{isRtl ? "الحقول المطلوبة: الاسم والوظيفة فقط." : "Required: name and role only."}</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyImport;
