import { describe, expect, it } from "vitest";
import { isArchived, mapProjectRow, type ProjectRow } from "./projects";

/**
 * Build a project row with sensible defaults, overridable per test.
 * @param {Partial<ProjectRow>} overrides - Columns to override.
 * @returns {ProjectRow} The row.
 */
function rowOf(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: "p1",
    name: "Website",
    created_at: "2026-07-21T10:00:00.000Z",
    created_by: "u1",
    archived_at: null,
    archived_by: null,
    deleted_at: null,
    deleted_by: null,
    ...overrides,
  };
}

describe("mapProjectRow", () => {
  it("maps snake_case columns to camelCase fields", () => {
    const project = mapProjectRow(
      rowOf({ archived_at: "2026-07-22T00:00:00.000Z", archived_by: "u2" }),
    );

    expect(project).toEqual({
      id: "p1",
      name: "Website",
      createdAt: "2026-07-21T10:00:00.000Z",
      createdBy: "u1",
      archivedAt: "2026-07-22T00:00:00.000Z",
      archivedBy: "u2",
      deletedAt: null,
      deletedBy: null,
    });
  });
});

describe("isArchived", () => {
  it("is false for an active project", () => {
    expect(isArchived(mapProjectRow(rowOf()))).toBe(false);
  });

  it("is true when archived and not deleted", () => {
    expect(
      isArchived(mapProjectRow(rowOf({ archived_at: "2026-07-22T00:00:00Z" }))),
    ).toBe(true);
  });

  it("is false once deleted, even if it was archived", () => {
    expect(
      isArchived(
        mapProjectRow(
          rowOf({
            archived_at: "2026-07-22T00:00:00Z",
            deleted_at: "2026-07-23T00:00:00Z",
          }),
        ),
      ),
    ).toBe(false);
  });
});
