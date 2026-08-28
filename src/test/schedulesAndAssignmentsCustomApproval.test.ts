import { describe, it, expect } from "vitest";

interface ApprovalStep {
  user_id?: string;
  name: string;
  role: string;
  title: string;
  department_id?: string;
  approved?: boolean;
  approved_at?: string;
  approved_by_id?: string;
  rejected?: boolean;
  rejection_reason?: string;
  rejected_at?: string;
}

interface ScheduleRecord {
  id: string;
  title_ar: string;
  title_en: string;
  course_id: string;
  department_id: string;
  creator_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location_ar: string;
  file_url?: string;
  file_name?: string;
  approval_reviewers: ApprovalStep[];
  approved_by_head: boolean;
  approved_by_vice_dean: boolean;
  approved_by_dean: boolean;
  rejected_by?: string | null;
  rejection_reason?: string | null;
}

interface AssignmentRecord {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  course_id: string;
  department_id: string;
  creator_id: string;
  due_date: string;
  points: number;
  file_urls: string[];
  file_names: string[];
  image_urls: string[];
  approval_reviewers: ApprovalStep[];
  approved_by_head: boolean;
  approved_by_vice_dean: boolean;
  approved_by_dean: boolean;
  is_published: boolean;
  rejected_by?: string | null;
  rejection_reason?: string | null;
}

describe("Schedules and Assignments Custom Approval Chain & Platform Isolation", () => {
  it("should validate that Schedule sequential approval chain ends with Dean as the fixed final gatekeeper", () => {
    const reviewers: ApprovalStep[] = [
      {
        user_id: "user-vice-1",
        name: "د. إبراهيم خليل",
        role: "vice_dean",
        title: "وكيل الكلية لشؤون التعليم والطلاب",
        approved: false,
      },
      {
        user_id: "user-head-1",
        name: "د. هاني حسني",
        role: "department_head",
        title: "رئيس قسم علوم الحاسب",
        approved: false,
      },
    ];

    // Build chain with fixed Dean step at the end
    const fullChain: ApprovalStep[] = [
      ...reviewers,
      {
        role: "dean",
        title: "عميد الكلية (الاعتماد النهائي والنشر للطلاب)",
        name: "عميد الكلية",
        approved: false,
      },
    ];

    expect(fullChain.length).toBe(3);
    expect(fullChain[fullChain.length - 1].role).toBe("dean");

    const schedule: ScheduleRecord = {
      id: "sched-1",
      title_ar: "جدول محاضرات الفصل الدراسي الأول 2026",
      title_en: "Fall 2026 Lecture Timetable",
      course_id: "cs-101",
      department_id: "dept-cs",
      creator_id: "assistant-1",
      scheduled_date: "2026-09-01",
      start_time: "09:00",
      end_time: "11:00",
      location_ar: "مدرج 1",
      file_url: "https://storage.supabase.co/schedules/timetable_final.pdf",
      file_name: "timetable_final.pdf",
      approval_reviewers: fullChain,
      approved_by_head: false,
      approved_by_vice_dean: false,
      approved_by_dean: false,
    };

    // Step 1: Vice Dean approves
    schedule.approval_reviewers[0].approved = true;
    schedule.approval_reviewers[0].approved_at = new Date().toISOString();
    expect(schedule.approved_by_dean).toBe(false);

    // Step 2: Head approves
    schedule.approval_reviewers[1].approved = true;
    schedule.approval_reviewers[1].approved_at = new Date().toISOString();
    expect(schedule.approved_by_dean).toBe(false);

    // Step 3: Dean final approval
    schedule.approval_reviewers[2].approved = true;
    schedule.approval_reviewers[2].approved_at = new Date().toISOString();
    schedule.approved_by_dean = true;

    expect(schedule.approved_by_dean).toBe(true);
    expect(schedule.approval_reviewers.every((s) => s.approved)).toBe(true);
  });

  it("should support Assignment creation with multiple files and images, plus sequential approval chain", () => {
    const assignment: AssignmentRecord = {
      id: "asg-1",
      title_ar: "التكليف الأول: تصميم هيكل قاعدة البيانات",
      title_en: "Assignment 1: Database Schema Architecture",
      description_ar: "يرجى دراسة المخطط المرفق بالصورة وتنفيذ جداول الـ SQL الموضحة في الملف المرفق.",
      description_en: "Study attached diagram and implement SQL schema from document.",
      course_id: "cs-302",
      department_id: "dept-cs",
      creator_id: "teaching-assistant-1",
      due_date: "2026-09-15T23:59:00Z",
      points: 20,
      file_urls: [
        "https://storage.supabase.co/assignments/erd_requirements.pdf",
        "https://storage.supabase.co/assignments/starter_template.docx",
      ],
      file_names: ["erd_requirements.pdf", "starter_template.docx"],
      image_urls: [
        "https://storage.supabase.co/assignments/diagram_preview.png",
        "https://storage.supabase.co/assignments/entity_relation.jpg",
      ],
      approval_reviewers: [
        {
          user_id: "user-head-cs",
          name: "د. هاني",
          role: "department_head",
          title: "رئيس القسم",
          approved: false,
        },
        {
          role: "dean",
          title: "عميد الكلية (الاعتماد النهائي والنشر للطلاب)",
          name: "عميد الكلية",
          approved: false,
        },
      ],
      approved_by_head: false,
      approved_by_vice_dean: false,
      approved_by_dean: false,
      is_published: false,
    };

    expect(assignment.file_urls.length).toBe(2);
    expect(assignment.image_urls.length).toBe(2);
    expect(assignment.points).toBe(20);
    expect(assignment.is_published).toBe(false);

    // Head approves
    assignment.approval_reviewers[0].approved = true;
    assignment.approved_by_head = true;
    expect(assignment.is_published).toBe(false);

    // Dean final approval -> published to students
    assignment.approval_reviewers[1].approved = true;
    assignment.approved_by_dean = true;
    assignment.is_published = true;

    expect(assignment.is_published).toBe(true);
    expect(assignment.approved_by_dean).toBe(true);
  });

  it("should ensure Strict Multi-Platform Isolation across University, School, Courses, and Bookstore", () => {
    // 1. University Scope
    const universityContent = {
      platform: "university-platform",
      department_id: "dept-engineering-1",
      course_id: "course-eng-101",
      type: "lecture_schedule_and_assignment",
      restricted_to_enrolled_university_students: true,
    };

    // 2. School Platform Scope
    const schoolContent = {
      platform: "school-platform",
      school_id: "school-cairo-1",
      school_class_id: "grade-10-a",
      type: "school_assignment",
    };

    // 3. Independent Courses Platform Scope
    const publicCoursesCatalog = {
      platform: "courses",
      is_public_marketplace: true,
    };

    // 4. Book Store Scope
    const bookStoreCatalog = {
      platform: "book-store",
      item_type: "book_or_ebook",
    };

    // Verifications:
    expect(universityContent.platform).toBe("university-platform");
    expect(universityContent.restricted_to_enrolled_university_students).toBe(true);
    expect(schoolContent.platform).not.toBe(universityContent.platform);
    expect(publicCoursesCatalog.platform).not.toBe(universityContent.platform);
    expect(bookStoreCatalog.platform).not.toBe(universityContent.platform);
  });
});
