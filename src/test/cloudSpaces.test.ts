import { describe, expect, it } from "vitest";
import { cloudSpaces, retiredPlatformEntries } from "@/lib/cloudSpaces";

describe("Institution cloud-space offering", () => {
  it("serves colleges, institutes, schools, language and training centers", () => {
    expect(cloudSpaces.map(space => space.id)).toEqual(["college", "institute", "school", "language", "training"]);
  });
  it.each(["/courses", "/book-store", "/school-platform"])("retires standalone entry %s", route => {
    expect(retiredPlatformEntries).toContain(route);
  });
  it("keeps schools available as an institutional workspace", () => {
    expect(cloudSpaces.find(space => space.id === "school")?.route).toBe("/school-registration");
  });
});