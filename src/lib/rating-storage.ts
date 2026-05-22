// Tracks whether the current user has already submitted a mandatory rating
// for a given item (lecture, stream, assignment, quiz, schedule, …).
// Stored locally so the rating dialog never re-appears for the same item.

const PREFIX = "unigates:rated:";

export type RatingKind = "lecture" | "stream" | "assignment" | "quiz" | "schedule";

export const ratingKey = (kind: RatingKind, id: string | number | undefined | null) =>
  `${PREFIX}${kind}:${id ?? "unknown"}`;

export const hasRated = (kind: RatingKind, id: string | number | undefined | null) => {
  try {
    return typeof window !== "undefined" && !!localStorage.getItem(ratingKey(kind, id));
  } catch {
    return false;
  }
};

export const markRated = (kind: RatingKind, id: string | number | undefined | null) => {
  try {
    localStorage.setItem(ratingKey(kind, id), "1");
  } catch {
    /* noop */
  }
};
