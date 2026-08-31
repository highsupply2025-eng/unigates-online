import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileSpreadsheet, ArrowLeft, ArrowRight, Download, Upload, Loader2,
  CheckCircle2, AlertCircle, Building2, Users, Copy, Sparkles, ShieldCheck,
  Eye, RefreshCw, FileCheck2, Check, X, AlertTriangle
} from "lucide-react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstitutionIdentity } from "@/hooks/useInstitutionIdentity";
import { generateStrongPassword } from "@/components/FacultyMemberForm";
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

interface ParsedPreviewRow {
  fullName: string;
  departmentRaw: string;
  targetDeptNames: string[];
  phone: string;
  email: string;
  gender: string;
  nationalId: string;
  academicYear: string;
  tempPassword: string;
  isValid: boolean;
  validationError?: string;
  rawObj: any;
  sourceRow: number;
}

interface CreatedAccountReportItem {
  fullName: string;
  departmentName: string;
  email: string;
  tempPassword: string;
  invitationCode: string;
  status: string;
}

const InstitutionFacultyImport = () => {
  const { language, dir } = useLanguage();
  const isRtl = dir === "rtl";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStudent = searchParams.get("role") === "student";
  const fileRef = useRef<HTMLInputElement>(null);
  const { identity, loading: identityLoading } = useInstitutionIdentity();

  const [departments, setDepartments] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // File preview & staging state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedPreviewRow[]>([]);
  const [embeddedPhotosMap, setEmbeddedPhotosMap] = useState<Map<number, EmbeddedFacultyPhoto>>(new Map());

  // Result state
  const [result, setResult] = useState<{
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
    createdAccounts: CreatedAccountReportItem[];
  } | null>(null);

  const institutionId = identity?.institutionId ?? "";
  const institutionType = identity?.institutionType ?? null;

  useEffect(() => {
    if (!identity) return;
    (async () => {
      try {
        const { data: depts } = await supabase
          .from("departments")
          .select("id, department_name, department_code")
          .eq("institution_id", identity.institutionId)
          .eq("institution_type", identity.institutionType);
        setDepartments(
          (depts || []).map((d: any) => ({
            id: d.id,
            name: d.department_name,
            code: d.department_code || "",
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [identity]);

  const norm = (v: any) => (v == null ? "" : String(v).trim());

  /* ------------------------------------------------------------------ */
  /*  Generate High-Quality Student Excel Template                      */
  /* ------------------------------------------------------------------ */
  const generateStudentTemplate = useCallback(async () => {
    const isEn = language === "en";
    const wb = new ExcelJS.Workbook();
    wb.creator = "UNIGATES Platform";
    wb.created = new Date();

    const ws = wb.addWorksheet(isEn ? "Student Data" : "بيانات الطلاب", {
      properties: { defaultColWidth: 20 },
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
          "Academic Level / Year",
          "Temporary Password (optional)",
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
          "الفرقة / المستوى الدراسي",
          "الرقم السري المؤقت (اختياري)",
          "ملاحظات",
          "رابط الصورة (اختياري)",
          "صورة شخصية",
        ];

    const sampleDepts = departments.map((d) => d.name).slice(0, 2);
    const dept1 = sampleDepts[0] || (isEn ? "Computer Engineering" : "هندسة الحاسب");
    const dept2 = sampleDepts[1] || (isEn ? "Computer Science" : "علوم الحاسب");

    const exampleRow1 = isEn
      ? [
          dept1,
          "Ahmed Mohamed Ali",
          "2003-05-15",
          "male",
          "29805151234567",
          "+201001234567",
          "ahmed.mohamed@example.com",
          "Cairo, Egypt",
          "Second Year",
          "Pass@1234",
          "Honor student",
          "",
          "",
        ]
      : [
          dept1,
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

    const exampleRow2 = isEn
      ? [
          dept2,
          "Sara Mahmoud Ibrahim",
          "2004-09-20",
          "female",
          "29909201234568",
          "+201009876543",
          "sara.mahmoud@example.com",
          "Giza, Egypt",
          "First Year",
          "",
          "",
          "",
          "",
        ]
      : [
          dept2,
          "سارة محمود إبراهيم",
          "2004-09-20",
          "أنثى",
          "29909201234568",
          "+201009876543",
          "sara.mahmoud@example.com",
          "الجيزة، مصر",
          "الفرقة الأولى",
          "",
          "",
          "",
          "",
        ];

    ws.addRow(headers);
    ws.addRow(exampleRow1);
    ws.addRow(exampleRow2);

    // Style Header Row
    const headerRow = ws.getRow(1);
    headerRow.height = 34;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0D9488" }, // Luxury Teal 600
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "medium", color: { argb: "FF0F766E" } },
      };
    });

    // Style Example Rows
    [2, 3].forEach((rowIdx) => {
      const row = ws.getRow(rowIdx);
      row.height = 24;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { size: 10 };
      });
    });

    // Generous Column Widths
    ws.getColumn(1).width = 28;  // الأقسام
    ws.getColumn(2).width = 26;  // الاسم الكامل
    ws.getColumn(3).width = 24;  // تاريخ الميلاد
    ws.getColumn(4).width = 12;  // النوع
    ws.getColumn(5).width = 20;  // الرقم القومي
    ws.getColumn(6).width = 20;  // رقم الهاتف
    ws.getColumn(7).width = 30;  // البريد الإلكتروني
    ws.getColumn(8).width = 24;  // العنوان
    ws.getColumn(9).width = 22;  // الفرقة / المستوى الدراسي
    ws.getColumn(10).width = 26; // الرقم السري المؤقت
    ws.getColumn(11).width = 20; // ملاحظات
    ws.getColumn(12).width = 30; // رابط الصورة
    ws.getColumn(13).width = 18; // صورة شخصية

    // Gender Dropdown Data Validation
    const genderList = isEn ? "male,female" : "ذكر,أنثى";
    for (let row = 2; row <= 1000; row++) {
      ws.getCell(row, 4).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${genderList}"`],
        showErrorMessage: true,
        errorTitle: isEn ? "Invalid Gender" : "قيمة غير صحيحة",
        error: isEn ? "Please select male or female." : "يرجى اختيار ذكر أو أنثى.",
      };
    }

    // --- Sheet 2: Luxury Instructions ---
    const stdInstrName = isEn ? "Instructions" : "تعليمات تعبئة ملف الطلاب";
    const isSheet = wb.addWorksheet(stdInstrName, {
      properties: { defaultColWidth: 22 },
    });
    isSheet.views = [{ rightToLeft: !isEn }];

    isSheet.mergeCells("A1:G1");
    const titleCell = isSheet.getCell("A1");
    titleCell.value = isEn
      ? "UNIGATES — Student Registration Template Instructions"
      : "منصة UNIGATES — دليل وتعليمات تعبئة ملف تسجيل الطلاب";
    titleCell.font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D9488" },
    };
    isSheet.getRow(1).height = 40;

    isSheet.addRow([]);

    const generalNotes = isEn
      ? [
          "1. Do not modify the header row in Sheet 1.",
          "2. Start filling student data from row 2 onward.",
          "3. Required columns: 'Departments' and 'Full Name'. All other columns are optional.",
          "4. Department Name: Enter the exact department name or code as registered in your dashboard.",
          "5. Multiple Departments: To enroll a student in multiple departments, separate names with commas (e.g. Computer Engineering, Computer Science).",
          "6. Temporary Password: If provided, the student will use it to log in and change their password. If left blank, a secure password will be generated automatically.",
          "7. Date of Birth format: YYYY-MM-DD (e.g. 2003-05-15).",
          "8. Photo: Optional — insert JPG/PNG image into the 'Photo Image' cell or provide a URL.",
        ]
      : [
          "1. لا تقم بتعديل أو حذف صف العناوين في الورقة الأولى (صف 1).",
          "2. ابدأ في كتابة وتعبئة بيانات الطلاب بدءاً من الصف الثاني (صف 2).",
          "3. الأعمدة الإلزامية الأساسية: «الأقسام» و «الاسم الكامل»، وباقي الأعمدة اختيارية.",
          "4. اسم القسم: اكتب اسم القسم تماماً كما هو مسجل في لوحة إدارة الكلية/المعهد أو كود القسم.",
          "5. التسجيل في أكثر من قسم: يمكنك فصل الأقسام بفاصلة في نفس الخلية (مثال: هندسة الحاسب, علوم الحاسب).",
          "6. الرقم السري المؤقت: إذا تم تحديده، سيستخدمه الطالب للدخول وتعيين كلمة سر جديدة، وإذا تُرِك فارغاً سيتم توليد رقم سري مؤقت تلقائياً.",
          "7. صيغة تاريخ الميلاد: YYYY-MM-DD (مثال: 2003-05-15).",
          "8. الصورة الشخصية: اختيارية — يمكن إدراج صورة داخل خلية «صورة شخصية» أو وضع رابط مباشر.",
        ];

    generalNotes.forEach((note) => {
      const r = isSheet.addRow([note]);
      r.font = { size: 11, bold: note.startsWith("1.") || note.startsWith("3.") };
    });

    isSheet.addRow([]);
    isSheet.addRow([isEn ? "Active Departments in Your Institution:" : "الأقسام الأكاديمية المسجلة في مؤسستك:"]);
    isSheet.getRow(isSheet.rowCount).font = { bold: true, size: 12, color: { argb: "FF0D9488" } };

    if (departments.length > 0) {
      departments.forEach((dept) => {
        isSheet.addRow([dept.name, dept.code ? `(كود: ${dept.code})` : ""]);
      });
    } else {
      isSheet.addRow([isEn ? "No departments found." : "لا توجد أقسام مسجلة حتى الآن."]);
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isEn ? "UNIGATES_students_template_en.xlsx" : "قالب_تسجيل_الطلاب_UNIGATES.xlsx";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: isRtl ? "تم تحميل القالب بنجاح" : "Template Downloaded",
      description: isRtl ? "تم تحميل ملف Excel المحسن لتسجيل الطلاب" : "Enhanced Excel template downloaded",
    });
  }, [language, departments, isRtl]);

  /* ------------------------------------------------------------------ */
  /*  Generate Faculty Template                                         */
  /* ------------------------------------------------------------------ */
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
          "Full Name", "Role", "Department", "Date of Birth (YYYY-MM-DD)", "Gender",
          "National ID", "Email", "Phone", "Address", "Qualification",
          "Specialization", "Hire Date (YYYY-MM-DD)", "Notes", "Photo URL (optional)", "Photo Image 4×6",
        ]
      : [
          "الاسم الكامل", "الوظيفة", "القسم", "تاريخ الميلاد (YYYY-MM-DD)", "النوع",
          "الرقم القومي", "البريد الإلكتروني", "رقم الهاتف", "العنوان", "المؤهل العلمي",
          "التخصص", "تاريخ التعيين (YYYY-MM-DD)", "ملاحظات", "رابط الصورة (اختياري)", "صورة شخصية 4×6",
        ];

    const exampleRow = isEn
      ? [
          "Ahmed Mohamed Ali", "Doctor", departments[0]?.name || "Computer Science", "1985-05-12", "male",
          "29001011234567", "ahmed@example.com", "01000000000", "Cairo", "PhD",
          "Artificial Intelligence", "2020-09-01", "", "https://example.com/photo.jpg", "",
        ]
      : [
          "أحمد محمد علي", "دكتور", departments[0]?.name || "قسم علوم الحاسب", "1985-05-12", "ذكر",
          "29001011234567", "ahmed@example.com", "01000000000", "القاهرة", "دكتوراه",
          "ذكاء اصطناعي", "2020-09-01", "", "https://example.com/photo.jpg", "",
        ];

    ws.addRow(headers);
    ws.addRow(exampleRow);

    const headerRow = ws.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0D9488" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    ws.getColumn(1).width = 26;  // Full Name
    ws.getColumn(2).width = 28;  // Role
    ws.getColumn(3).width = 26;  // Department
    ws.getColumn(4).width = 24;  // Date of Birth
    ws.getColumn(5).width = 12;  // Gender
    ws.getColumn(6).width = 20;  // National ID
    ws.getColumn(7).width = 28;  // Email
    ws.getColumn(8).width = 20;  // Phone
    ws.getColumn(9).width = 22;  // Address
    ws.getColumn(10).width = 20; // Qualification
    ws.getColumn(11).width = 20; // Specialization
    ws.getColumn(12).width = 24; // Hire Date
    ws.getColumn(13).width = 20; // Notes
    ws.getColumn(14).width = 30; // Photo URL
    ws.getColumn(15).width = 18; // Photo Image

    const roleList = FACULTY_ROLE_OPTIONS.map((r) => r[isEn ? "en" : "ar"]).join(",");
    for (let row = 2; row <= 1000; row++) {
      ws.getCell(row, 2).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${roleList}"`],
        showErrorMessage: true,
        errorTitle: isEn ? "Invalid Role" : "وظيفة غير صحيحة",
        error: isEn ? "Please select a role from the dropdown list." : "يرجى اختيار مسمى وظيفي من القائمة المنسدلة.",
      };
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isEn ? "UNIGATES_faculty_template_en.xlsx" : "قالب_أعضاء_التدريس_UNIGATES.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, [language, departments]);

  /* ------------------------------------------------------------------ */
  /*  Process & Preview File on Drop or Select                          */
  /* ------------------------------------------------------------------ */
  const processUploadedFile = async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setParsedPreview([]);

    try {
      if (file.size > MAX_FACULTY_WORKBOOK_BYTES) {
        throw new Error(isRtl ? "حجم ملف Excel أكبر من 20MB" : "Excel file exceeds 20MB");
      }

      const buf = await file.arrayBuffer();
      setFileBuffer(buf);

      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const embedded = file.name.toLowerCase().endsWith(".xlsx")
        ? await extractEmbeddedFacultyPhotos(buf, isStudent ? STUDENT_PHOTO_HEADER : undefined)
        : new Map<number, EmbeddedFacultyPhoto>();
      setEmbeddedPhotosMap(embedded);

      const deptByName = new Map(departments.map((d) => [d.name.trim().toLowerCase(), d.id]));
      const deptByCode = new Map<string, string>();
      departments.forEach((d) => {
        if (d.code) deptByCode.set(d.code.trim().toUpperCase(), d.id);
      });

      const previewRows: ParsedPreviewRow[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const sourceRow = typeof r.__rowNum__ === "number" ? r.__rowNum__ + 1 : i + 2;
        const fullName = norm(r["الاسم الكامل"] || r["full_name"] || r["اسم الطالب"]);
        if (!fullName) continue;

        const deptRaw = norm(
          r["الأقسام"] || r["القسم"] || r["department"] || r["departments"] ||
          r["كود القسم"] || r["أكواد الأقسام"] || r["department_code"] || r["dept_code"]
        );

        let targetDeptNames: string[] = [];
        let isValid = true;
        let validationError = "";

        if (isStudent) {
          const parts = deptRaw.split(/[\s,،]+/).map((c) => c.trim()).filter(Boolean);
          const resolvedIds: string[] = [];

          for (const part of parts) {
            const upper = part.toUpperCase();
            const lower = part.toLowerCase();
            const byCode = deptByCode.get(upper);
            const byName = deptByName.get(lower);

            if (byCode || byName) {
              const matchedDept = departments.find((d) => d.id === (byCode || byName));
              if (matchedDept) {
                targetDeptNames.push(matchedDept.name);
                resolvedIds.push(matchedDept.id);
              }
            }
          }

          if (resolvedIds.length === 0) {
            isValid = false;
            validationError = isRtl ? "القسم غير مسجل في الكلية" : "Unknown department";
          }
        }

        const phone = norm(r["رقم الهاتف"] || r["phone"] || r["الهاتف"]);
        const email = norm(r["البريد الإلكتروني"] || r["email"] || r["البريد"]);
        const gender = norm(r["النوع"] || r["gender"] || r["الجنس"]);
        const nationalId = norm(r["الرقم القومي"] || r["national_id"] || r["الهوية"]);
        const academicYear = norm(r["الفرقة / المستوى الدراسي"] || r["المؤهل الدراسي"] || r["qualification"] || r["الفرقة"]);
        const tempPassword = norm(
          r["الرقم السري المؤقت (اختياري)"] || r["الرقم السري المؤقت"] ||
          r["temporary_password"] || r["temp_password"] || r["password"]
        );

        previewRows.push({
          fullName,
          departmentRaw: deptRaw || (isRtl ? "غير محدد" : "Unspecified"),
          targetDeptNames,
          phone,
          email,
          gender,
          nationalId,
          academicYear,
          tempPassword,
          isValid,
          validationError,
          rawObj: r,
          sourceRow,
        });
      }

      setParsedPreview(previewRows);

      if (previewRows.length === 0) {
        toast({
          title: isRtl ? "ملف فارغ" : "Empty File",
          description: isRtl ? "لم يتم العثور على أي صفوف صالحة بالملف." : "No valid student data found in file.",
          variant: "destructive",
        });
      } else {
        toast({
          title: isRtl ? "تمت قراءة الملف بنجاح" : "File Parsed",
          description: isRtl ? `تم استخراج ${previewRows.length} سجل للمعاينة.` : `Extracted ${previewRows.length} records.`,
        });
      }
    } catch (err: any) {
      toast({
        title: isRtl ? "خطأ في قراءة الملف" : "File Read Error",
        description: err.message,
        variant: "destructive",
      });
      setSelectedFile(null);
      setParsedPreview([]);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Execute Import to Database                                        */
  /* ------------------------------------------------------------------ */
  const handleExecuteImport = async () => {
    if (!parsedPreview.length || uploading) return;
    setUploading(true);
    setResult(null);

    try {
      const deptByName = new Map(departments.map((d) => [d.name.trim().toLowerCase(), d.id]));
      const deptByCode = new Map<string, string>();
      departments.forEach((d) => {
        if (d.code) deptByCode.set(d.code.trim().toUpperCase(), d.id);
      });

      let success = 0;
      let failed = 0;
      let skipped = 0;
      const errors: string[] = [];
      const createdAccounts: CreatedAccountReportItem[] = [];

      for (let i = 0; i < parsedPreview.length; i++) {
        const item = parsedPreview[i];
        const r = item.rawObj;
        const sourceRow = item.sourceRow;
        const full_name = item.fullName;
        const role = isStudent ? "student" : (ROLE_MAP[norm(r["الوظيفة"] || r["role"])] || "lecturer");

        let targetDeptIds: string[] = [];
        if (isStudent) {
          const parts = norm(
            r["الأقسام"] || r["القسم"] || r["department"] || r["departments"] ||
            r["كود القسم"] || r["أكواد الأقسام"] || r["department_code"] || r["dept_code"]
          ).split(/[\s,،]+/).map((c) => c.trim()).filter(Boolean);

          for (const part of parts) {
            const byCode = deptByCode.get(part.toUpperCase());
            const byName = deptByName.get(part.toLowerCase());
            if (byCode) targetDeptIds.push(byCode);
            else if (byName) targetDeptIds.push(byName);
          }
          targetDeptIds = [...new Set(targetDeptIds)];

          if (targetDeptIds.length === 0) {
            failed++;
            errors.push(`${isRtl ? "صف" : "Row"} ${sourceRow} (${full_name}): ${isRtl ? "القسم غير صالح أو غير مسجل" : "invalid department"}`);
            continue;
          }
        } else {
          const deptName = norm(r["القسم"] || r["department"]);
          const dId = deptName ? deptByName.get(deptName.toLowerCase()) : undefined;
          if (dId) targetDeptIds = [dId];
        }

        const rawPhotoUrl = norm(r["رابط الصورة (اختياري)"] || r["رابط الصورة"] || r["photo_url"]);
        const assignedTempPassword = item.tempPassword || generateStrongPassword();

        const baseRow = {
          full_name,
          role,
          date_of_birth: norm(r["تاريخ الميلاد (YYYY-MM-DD)"] || r["تاريخ الميلاد"] || r["date_of_birth"]) || null,
          email: item.email || null,
          phone: item.phone || null,
          national_id: item.nationalId || null,
          gender: item.gender || null,
          address: norm(r["العنوان"] || r["address"]) || null,
          qualification: item.academicYear || null,
          specialization: isStudent ? null : (norm(r["التخصص"] || r["specialization"]) || null),
          hire_date: isStudent ? null : (norm(r["تاريخ التعيين (YYYY-MM-DD)"] || r["تاريخ التعيين"] || r["hire_date"]) || null),
          notes: norm(r["ملاحظات"] || r["notes"]) || null,
          photo_url: rawPhotoUrl || null,
        };

        let insertError: any = null;

        if (isStudent) {
          const invitationCode = `STU-${Date.now().toString(36).toUpperCase()}-${crypto
            .getRandomValues(new Uint32Array(1))[0]
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`;

          const rows = targetDeptIds.map((department_id) => ({
            ...baseRow,
            department_id,
            invitation_code: invitationCode,
          }));

          const { error } = await supabase.from("department_members").insert(rows);
          insertError = error;

          if (!error) {
            const primaryDept = departments.find((d) => d.id === targetDeptIds[0]);
            createdAccounts.push({
              fullName: full_name,
              departmentName: primaryDept?.name || item.departmentRaw,
              email: item.email || "-",
              tempPassword: assignedTempPassword,
              invitationCode,
              status: isRtl ? "تمت الإضافة بنجاح" : "Added Successfully",
            });
          }
        } else {
          if (!institutionId || !institutionType) {
            insertError = new Error(isRtl ? "تعذر تحديد الكلية أو المعهد" : "Unable to determine institution");
          } else {
            let photoPayload: FacultyPhotoPayload | undefined;
            const embeddedPhoto = embeddedPhotosMap.get(sourceRow);
            if (embeddedPhoto) {
              try {
                photoPayload = await resizeFacultyPhoto(embeddedPhoto);
              } catch {
                /* ignore */
              }
            }

            const tempPassword = `Tmp${assignedTempPassword}!`;
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
              }
            );

            if (fnError || (fnData && (fnData as any).success === false)) {
              insertError = new Error(fnError?.message || (fnData as any)?.error || "Account creation failed");
            } else if (targetDeptIds.length > 0 && fnData && (fnData as any).user_id) {
              await supabase.rpc("assign_faculty_department", {
                p_user_id: (fnData as any).user_id,
                p_new_department_id: targetDeptIds[0],
                p_specific_role: baseRow.role,
                p_full_name: baseRow.full_name,
                p_email: (fnData as any).email || baseRow.email || null,
                p_phone: baseRow.phone,
              });
            }
          }
        }

        if (insertError) {
          failed++;
          errors.push(`${isRtl ? "صف" : "Row"} ${sourceRow} (${full_name}): ${insertError.message}`);
        } else {
          success++;
        }
      }

      if (success > 0) {
        try {
          sessionStorage.setItem("institution-dashboard-force-refresh", Date.now().toString());
        } catch { /* ignore */ }
      }

      setResult({
        success,
        skipped,
        failed,
        errors: errors.slice(0, 30),
        createdAccounts,
      });

      toast({
        title: isRtl ? `تمت معالجة ${success} طالب بنجاح` : `Imported ${success} students`,
        description: isRtl ? "يمكنك تحميل كشف الأكواد وكلمات المرور المؤقتة" : "You can download credentials report",
      });
    } catch (err: any) {
      toast({
        title: isRtl ? "فشل الاستيراد" : "Import Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Download Created Accounts Excel Report                            */
  /* ------------------------------------------------------------------ */
  const exportCreatedAccountsReport = () => {
    if (!result?.createdAccounts?.length) return;

    const rows = result.createdAccounts.map((acc, idx) => ({
      "م": idx + 1,
      "اسم الطالب": acc.fullName,
      "القسم الأكاديمي": acc.departmentName,
      "كود التسجيل": acc.invitationCode,
      "الرقم السري المؤقت": acc.tempPassword,
      "البريد الإلكتروني": acc.email,
      "الحالة": acc.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "كشف الحسابات");
    XLSX.writeFile(workbook, `تقرير_حسابات_الطلاب_المستوردة_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({
      title: isRtl ? "تم تحميل التقرير" : "Report Downloaded",
      description: isRtl ? `تم تصدير كشف ${rows.length} طالب مع كلمات المرور` : "Credentials report saved",
    });
  };

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
      {/* 1. Header Bar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-40 shadow-xl">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 shrink-0">
              <FileSpreadsheet className="w-6 h-6" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-white truncate leading-tight">
                {isStudent
                  ? (isRtl ? "استيراد بيانات الطلاب من ملف Excel" : "Bulk Student Excel Import")
                  : (isRtl ? "رفع واستيراد أعضاء التدريس" : "Faculty Excel Import")}
              </h1>
              <p className="text-xs font-bold text-teal-300 truncate mt-0.5">
                {isRtl ? "توليد الحسابات وأكواد التسجيل للطلاب دفعة واحدة" : "Bulk account creation and invitation generator"}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl font-black text-xs gap-1.5 border-white/20 bg-white/5 hover:bg-white/15 text-white shadow-sm"
            onClick={() => navigate(isStudent ? "/institution/dashboard?tab=students" : "/institution/dashboard?tab=faculty")}
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isRtl ? "العودة للوحة الإدارة" : "Back to Dashboard"}</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl space-y-6">
        {/* 2. Three-Step Visual Stepper Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30 flex items-center gap-3.5 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 font-black text-base flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <p className="text-xs font-extrabold text-teal-400">{isRtl ? "الخطوة الأولى" : "Step 1"}</p>
              <p className="text-sm font-black text-white">{isRtl ? "تحميل القالب النموذجي" : "Download Template"}</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 shadow-md ${
            selectedFile
              ? "bg-slate-900/80 border-teal-500/30"
              : "bg-slate-900/40 border-white/10 opacity-75"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 font-black text-base flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <p className="text-xs font-extrabold text-teal-400">{isRtl ? "الخطوة الثانية" : "Step 2"}</p>
              <p className="text-sm font-black text-white">{isRtl ? "رفع ومعاينة البيانات" : "Upload & Preview"}</p>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 shadow-md ${
            result
              ? "bg-slate-900/80 border-emerald-500/40"
              : "bg-slate-900/40 border-white/10 opacity-75"
          }`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-base flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <p className="text-xs font-extrabold text-emerald-400">{isRtl ? "الخطوة الثالثة" : "Step 3"}</p>
              <p className="text-sm font-black text-white">{isRtl ? "التأكيد والتقرير" : "Confirm & Report"}</p>
            </div>
          </div>
        </div>

        {/* 3. Step 1: Download & Department Quick Reference Box */}
        <Card className="rounded-3xl border-2 border-teal-500/30 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <span>{isRtl ? "تحميل قالب تسجيل الطلاب المحدث" : "Download Student Excel Template"}</span>
              </h2>
              <p className="text-xs text-slate-300 font-semibold">
                {isRtl
                  ? "قالب رسمي منسق يتضمن كافة الأعمدة وصيغ البيانات المعتمدة في المنصة."
                  : "Pre-formatted official template with all required columns and validations."}
              </p>
            </div>

            <Button
              size="lg"
              onClick={isStudent ? generateStudentTemplate : generateFacultyTemplate}
              className="rounded-2xl font-black text-sm gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-xl shadow-teal-500/30 shrink-0"
            >
              <Download className="w-5 h-5" />
              <span>{isRtl ? "تحميل القالب (.XLSX)" : "Download Template (.XLSX)"}</span>
            </Button>
          </div>

          {/* Active Departments Lookup Reference */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>{isRtl ? "الأقسام المتاحة في مؤسستك (للاستخدام في عمود الأقسام):" : "Active Departments in your Institution:"}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {departments.length} {isRtl ? "أقسام مسجلة" : "Departments"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(d.name);
                    toast({
                      title: isRtl ? "تم نسخ اسم القسم" : "Department Copied",
                      description: d.name,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 hover:border-teal-400/60 text-xs font-black text-slate-200 hover:text-white flex items-center gap-2 transition-all group"
                  title={isRtl ? "اضغط لنسخ اسم القسم" : "Click to copy"}
                >
                  <span>{d.name}</span>
                  {d.code && (
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/30">
                      {d.code}
                    </span>
                  )}
                  <Copy className="w-3 h-3 text-slate-400 group-hover:text-teal-400" />
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* 4. Step 2: Drag & Drop Upload Zone */}
        <Card className="rounded-3xl border-2 border-white/15 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processUploadedFile(file);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              dragActive
                ? "border-teal-400 bg-teal-500/15 scale-[1.01]"
                : selectedFile
                ? "border-teal-500/60 bg-teal-500/5 hover:border-teal-400"
                : "border-white/20 bg-slate-950/40 hover:border-teal-400/60 hover:bg-slate-950/60"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processUploadedFile(file);
              }}
            />

            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-teal-500/30 shrink-0">
              <Upload className="w-9 h-9" strokeWidth={2.4} />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="text-lg sm:text-xl font-black text-white">
                {selectedFile ? selectedFile.name : (isRtl ? "اسحب وأفلت ملف Excel هنا أو اضغط للاختيار" : "Drag & drop Excel file here or click to browse")}
              </h3>
              <p className="text-xs font-bold text-slate-400">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB • ${parsedPreview.length} ${isRtl ? "طالب تم استخراجهم" : "students parsed"}`
                  : (isRtl ? "يدعم ملفات (.xlsx أو .xls) بحد أقصى 20 ميجابايت" : "Supports (.xlsx, .xls) up to 20MB")}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="font-bold text-xs bg-slate-900 border-white/20 text-slate-200">
                .XLSX
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-slate-900 border-white/20 text-slate-200">
                .XLS
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-teal-500/20 border-teal-500/40 text-teal-300">
                {isRtl ? "مطابقة تلقائية للأقسام" : "Auto Department Matching"}
              </Badge>
            </div>
          </div>

          {/* 5. Pre-Import Verification Table */}
          {parsedPreview.length > 0 && !result && (
            <div className="mt-8 space-y-4 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-white/15">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-teal-400" />
                    <span>{isRtl ? "معاينة بيانات الطلاب قبل الاستيراد" : "Pre-Import Data Preview"}</span>
                  </h4>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    {isRtl
                      ? `تم فحص ${parsedPreview.length} سجل. راجع البيانات أدناه ثم اضغط تأكيد البدء.`
                      : `${parsedPreview.length} records parsed. Review below and click confirm.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs px-3 py-1">
                    {parsedPreview.filter((r) => r.isValid).length} {isRtl ? "صالح" : "Valid"}
                  </Badge>
                  {parsedPreview.filter((r) => !r.isValid).length > 0 && (
                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-xs px-3 py-1">
                      {parsedPreview.filter((r) => !r.isValid).length} {isRtl ? "تحتاج مراجعة" : "Invalid"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/90 max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-900/90 sticky top-0 z-10">
                    <TableRow className="border-white/10">
                      <TableHead className="w-12 text-center text-slate-300 font-black">#</TableHead>
                      <TableHead className="text-slate-300 font-black">{isRtl ? "اسم الطالب" : "Student Name"}</TableHead>
                      <TableHead className="text-slate-300 font-black">{isRtl ? "القسم" : "Department"}</TableHead>
                      <TableHead className="text-slate-300 font-black">{isRtl ? "الهاتف" : "Phone"}</TableHead>
                      <TableHead className="text-slate-300 font-black">{isRtl ? "البريد" : "Email"}</TableHead>
                      <TableHead className="text-slate-300 font-black">{isRtl ? "الرقم السري" : "Temp Password"}</TableHead>
                      <TableHead className="text-center text-slate-300 font-black">{isRtl ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedPreview.map((r, idx) => (
                      <TableRow key={idx} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-center font-bold text-xs text-slate-400">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-white">
                          {r.fullName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.targetDeptNames.length > 0 ? (
                            <span className="font-bold text-teal-300">
                              {r.targetDeptNames.join(", ")}
                            </span>
                          ) : (
                            <span className="font-bold text-rose-400">
                              {r.departmentRaw}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-300">
                          {r.phone || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          {r.email || "-"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-teal-300">
                          {r.tempPassword ? "••••••••" : (isRtl ? "توليد تلقائي" : "Auto")}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.isValid ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                              {isRtl ? "جاهز" : "Ready"}
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black" title={r.validationError}>
                              {r.validationError || (isRtl ? "خطأ" : "Error")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Start Execution Button */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  size="lg"
                  disabled={uploading}
                  onClick={handleExecuteImport}
                  className="w-full sm:w-auto rounded-2xl font-black text-sm gap-2 bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-500 hover:from-teal-400 hover:to-emerald-500 text-white shadow-xl shadow-teal-500/30 px-8"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  <span>
                    {uploading
                      ? (isRtl ? "جاري الاستيراد والإنشاء..." : "Importing & Creating...")
                      : isRtl
                      ? `تأكيد واستيراد (${parsedPreview.length}) طالب الآن`
                      : `Confirm & Import (${parsedPreview.length}) Students`}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* 6. Post-Import Comprehensive Report Screen */}
          {result && (
            <div className="mt-8 p-6 rounded-3xl bg-slate-950/90 border border-white/15 space-y-6 animate-scale-in">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {isRtl ? "اكتملت عملية الاستيراد بنجاح" : "Import Process Completed"}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    {isRtl
                      ? `تمت إضافة ${result.success} طالب وتوليد حساباتهم وأكوادهم بنجاح.`
                      : `Successfully processed ${result.success} students with generated credentials.`}
                  </p>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <p className="text-2xl font-black text-emerald-400">{result.success}</p>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">{isRtl ? "ناجح" : "Success"}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <p className="text-2xl font-black text-amber-400">{result.skipped}</p>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">{isRtl ? "تم التخطي" : "Skipped"}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                  <p className="text-2xl font-black text-rose-400">{result.failed}</p>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">{isRtl ? "فشل" : "Failed"}</p>
                </div>
              </div>

              {/* Error messages if any */}
              {result.errors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <p className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isRtl ? "تنبيهات وأخطاء بعض الصفوف:" : "Row Warnings & Errors:"}</span>
                  </p>
                  <ul className="text-xs text-rose-200 list-disc ps-5 space-y-1">
                    {result.errors.map((er, idx) => (
                      <li key={idx}>{er}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {result.createdAccounts.length > 0 && (
                  <Button
                    size="lg"
                    onClick={exportCreatedAccountsReport}
                    className="w-full sm:w-auto rounded-2xl font-black text-xs gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isRtl ? "تحميل كشف الأكواد وكلمات المرور (Excel)" : "Download Credentials Report"}</span>
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(isStudent ? "/institution/dashboard?tab=students" : "/institution/dashboard?tab=faculty")}
                  className="w-full sm:w-auto rounded-2xl font-black text-xs gap-2 border-white/20 bg-white/5 hover:bg-white/15 text-white"
                >
                  <Users className="w-4 h-4" />
                  <span>{isRtl ? "الانتقال لدليل الطلاب" : "Go to Student Directory"}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default InstitutionFacultyImport;
