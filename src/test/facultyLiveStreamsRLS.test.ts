import { describe, it, expect } from "vitest";
import fs from "fs";

const MIGRATION = fs.readFileSync(
  "supabase/migrations/20260828163000_allow_faculty_leadership_live_streams.sql",
  "utf-8",
);

const CREATE_STREAM_SOURCE = fs.readFileSync(
  "src/components/streams/CreateLiveStreamView.tsx",
  "utf-8",
);

describe("Live Streams RLS and Creation for Faculty & Leadership", () => {
  it("drops the old restrictive 'Lecturers can create streams' policy", () => {
    expect(MIGRATION).toContain('DROP POLICY IF EXISTS "Lecturers can create streams" ON public.live_streams;');
  });

  it("creates permissive INSERT policy for department heads, deans, vice deans, and teaching assistants", () => {
    expect(MIGRATION).toContain('CREATE POLICY "Faculty and leadership can create streams"');
    expect(MIGRATION).toContain("department_head");
    expect(MIGRATION).toContain("dean");
    expect(MIGRATION).toContain("vice_dean");
    expect(MIGRATION).toContain("teaching_assistant");
    expect(MIGRATION).toContain("institution_faculty_members");
  });

  it("provides a secure RPC function create_live_stream_secure", () => {
    expect(MIGRATION).toContain("CREATE OR REPLACE FUNCTION public.create_live_stream_secure");
    expect(MIGRATION).toContain("SECURITY DEFINER");
    expect(MIGRATION).toContain("GRANT EXECUTE ON FUNCTION public.create_live_stream_secure TO authenticated;");
  });

  it("uses the secure RPC with fallback in CreateLiveStreamView", () => {
    expect(CREATE_STREAM_SOURCE).toContain('supabase.rpc("create_live_stream_secure"');
    expect(CREATE_STREAM_SOURCE).toContain('.from("live_streams")');
  });
});
