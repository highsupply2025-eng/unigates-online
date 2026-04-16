import * as XLSX from "xlsx";

export type QType = "mcq" | "true_false" | "short_answer" | "fill_blank";

export interface ParsedQuestion {
  question_type: QType;
  question_ar: string;
  question_en: string;
  option_a_ar: string | null;
  option_a_en: string | null;
  option_b_ar: string | null;
  option_b_en: string | null;
  option_c_ar: string | null;
  option_c_en: string | null;
  option_d_ar: string | null;
  option_d_en: string | null;
  correct_answer: string;
  expected_answer: string | null;
  points: number;
}

export interface ImportResult {
  questions: ParsedQuestion[];
  errors: { row: number; message: string }[];
}

const TYPE_MAP: Record<string, QType> = {
  mcq: "mcq", "multiple choice": "mcq", "اختيار من متعدد": "mcq", متعدد: "mcq",
  true_false: "true_false", tf: "true_false", "true/false": "true_false", "صح/خطأ": "true_false", "صح خطأ": "true_false",
  short_answer: "short_answer", short: "short_answer", essay: "short_answer", "إجابة قصيرة": "short_answer", مقالي: "short_answer",
  fill_blank: "fill_blank", fill: "fill_blank", blank: "fill_blank", "املأ الفراغ": "fill_blank", فراغ: "fill_blank",
};

const norm = (v: any) => (v == null ? "" : String(v).trim());
const normLower = (v: any) => norm(v).toLowerCase();

export const parseQuizFile = async (file: File): Promise<ImportResult> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const questions: ParsedQuestion[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // header + 1-indexed
    const typeRaw = normLower(row.type || row.question_type || "mcq");
    const qtype = TYPE_MAP[typeRaw] || (typeRaw as QType);
    if (!["mcq", "true_false", "short_answer", "fill_blank"].includes(qtype)) {
      errors.push({ row: rowNum, message: `Invalid type: ${typeRaw}` });
      return;
    }

    const question_ar = norm(row.question_ar);
    const question_en = norm(row.question_en);
    if (!question_ar || !question_en) {
      errors.push({ row: rowNum, message: "Missing question_ar or question_en" });
      return;
    }

    const correctRaw = normLower(row.correct_answer || "a");
    let correct_answer = "a";
    if (qtype === "mcq") {
      if (!["a", "b", "c", "d"].includes(correctRaw)) {
        errors.push({ row: rowNum, message: `MCQ correct_answer must be a/b/c/d (got: ${correctRaw})` });
        return;
      }
      correct_answer = correctRaw;
    } else if (qtype === "true_false") {
      if (["true", "t", "صح", "a", "1"].includes(correctRaw)) correct_answer = "a";
      else if (["false", "f", "خطأ", "b", "0"].includes(correctRaw)) correct_answer = "b";
      else { errors.push({ row: rowNum, message: `T/F correct_answer must be true/false` }); return; }
    }

    const points = parseInt(norm(row.points || row.score || "1")) || 1;
    const expected_answer = norm(row.expected_answer || row.answer || "") || null;

    if (qtype === "mcq") {
      const opts = ["a", "b", "c", "d"].map(o => ({
        ar: norm(row[`option_${o}_ar`]), en: norm(row[`option_${o}_en`])
      }));
      if (opts.some(o => !o.ar || !o.en)) {
        errors.push({ row: rowNum, message: "MCQ requires all 4 options (option_a_ar..option_d_en)" });
        return;
      }
      questions.push({
        question_type: qtype, question_ar, question_en,
        option_a_ar: opts[0].ar, option_a_en: opts[0].en,
        option_b_ar: opts[1].ar, option_b_en: opts[1].en,
        option_c_ar: opts[2].ar, option_c_en: opts[2].en,
        option_d_ar: opts[3].ar, option_d_en: opts[3].en,
        correct_answer, expected_answer: null, points,
      });
    } else if (qtype === "true_false") {
      questions.push({
        question_type: qtype, question_ar, question_en,
        option_a_ar: "صح", option_a_en: "True",
        option_b_ar: "خطأ", option_b_en: "False",
        option_c_ar: null, option_c_en: null, option_d_ar: null, option_d_en: null,
        correct_answer, expected_answer: null, points,
      });
    } else {
      // short_answer / fill_blank
      if (qtype === "fill_blank" && !expected_answer) {
        errors.push({ row: rowNum, message: "fill_blank requires expected_answer" });
        return;
      }
      questions.push({
        question_type: qtype, question_ar, question_en,
        option_a_ar: null, option_a_en: null, option_b_ar: null, option_b_en: null,
        option_c_ar: null, option_c_en: null, option_d_ar: null, option_d_en: null,
        correct_answer: "a", expected_answer, points,
      });
    }
  });

  return { questions, errors };
};

export const downloadTemplate = () => {
  const headers = [
    "type", "question_ar", "question_en",
    "option_a_ar", "option_a_en", "option_b_ar", "option_b_en",
    "option_c_ar", "option_c_en", "option_d_ar", "option_d_en",
    "correct_answer", "expected_answer", "points",
  ];
  const sample = [
    ["mcq", "ما هي عاصمة مصر؟", "Capital of Egypt?", "القاهرة", "Cairo", "الإسكندرية", "Alexandria", "أسوان", "Aswan", "الأقصر", "Luxor", "a", "", 1],
    ["true_false", "الشمس نجم", "The sun is a star", "", "", "", "", "", "", "", "", "true", "", 1],
    ["fill_blank", "أكبر محيط هو ___", "Largest ocean is ___", "", "", "", "", "", "", "", "", "", "Pacific", 2],
    ["short_answer", "اشرح قانون نيوتن الأول", "Explain Newton's 1st law", "", "", "", "", "", "", "", "", "", "Inertia: object stays at rest...", 3],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, "quiz_template.xlsx");
};
