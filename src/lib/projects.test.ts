import { describe, expect, it } from "vitest";
import {
  applyOptimistic,
  isArchived,
  mapProjectRow,
  type Project,
  type ProjectRow,
} from "./projects";

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

describe("applyOptimistic", () => {
  const existing: Project = mapProjectRow(
    rowOf({ id: "p1", name: "Existing" }),
  );

  it("prepends a created project (newest first)", () => {
    const created: Project = mapProjectRow(rowOf({ id: "tmp", name: "New" }));

    const next = applyOptimistic([existing], {
      type: "create",
      project: created,
    });

    expect(next.map((p) => p.id)).toEqual(["tmp", "p1"]);
  });

  it("stamps the archive columns on the matching project only", () => {
    const other = mapProjectRow(rowOf({ id: "p2" }));

    const next = applyOptimistic([existing, other], {
      type: "archive",
      id: "p1",
      at: "2026-07-22T12:00:00.000Z",
      by: "u9",
    });

    expect(next[0]).toMatchObject({
      id: "p1",
      archivedAt: "2026-07-22T12:00:00.000Z",
      archivedBy: "u9",
    });
    expect(next[1]).toEqual(other);
  });

  it("clears the archive columns for the matching project", () => {
    const archived = mapProjectRow(
      rowOf({
        id: "p1",
        archived_at: "2026-07-22T00:00:00Z",
        archived_by: "u2",
      }),
    );

    const next = applyOptimistic([archived], { type: "unarchive", id: "p1" });

    expect(next[0]).toMatchObject({ archivedAt: null, archivedBy: null });
  });

  it("removes a deleted project from the list", () => {
    const other = mapProjectRow(rowOf({ id: "p2" }));

    const next = applyOptimistic([existing, other], {
      type: "delete",
      id: "p1",
    });

    expect(next.map((p) => p.id)).toEqual(["p2"]);
  });

  it("does not mutate the input list", () => {
    const list = [existing];
    applyOptimistic(list, { type: "delete", id: "p1" });
    expect(list).toEqual([existing]);
  });
});
