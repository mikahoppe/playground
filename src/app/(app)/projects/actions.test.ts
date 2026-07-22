import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRevalidatePath = vi.fn();

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ insert: mockInsert, update: mockUpdate }));
const mockGetUser = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    }),
}));

// Imported after the mocks are registered so the actions bind to the stubs.
const {
  createProject,
  archiveProject,
  deleteProject,
  unarchiveProject,
  restoreProject,
} = await import("./actions");

/**
 * Build a `FormData` carrying a single `name` field.
 * @param {string} name - The project name.
 * @returns {FormData} The populated form data.
 */
function formDataWithName(name: string): FormData {
  const data = new FormData();
  data.append("name", name);
  return data;
}

describe("project actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "new-id" }, error: null });
    mockEq.mockResolvedValue({ error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  });

  describe("createProject", () => {
    it("inserts a trimmed name and returns the new id", async () => {
      const result = await createProject(formDataWithName("  Website  "));

      expect(result).toEqual({ error: null, id: "new-id" });
      expect(mockFrom).toHaveBeenCalledWith("projects");
      expect(mockInsert).toHaveBeenCalledWith({ name: "Website" });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("rejects a blank name before touching the database", async () => {
      const result = await createProject(formDataWithName("   "));

      expect(result).toEqual({ error: "Enter a project name." });
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("returns the database error message on failure", async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

      const result = await createProject(formDataWithName("Website"));

      expect(result).toEqual({ error: "boom" });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("archiveProject", () => {
    it("sets archived_at/by for the current user, scoped by id", async () => {
      const result = await archiveProject("p1");

      expect(result).toEqual({ error: null });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ archived_by: "u1" }),
      );
      expect(mockUpdate.mock.calls[0]?.[0]).toHaveProperty("archived_at");
      expect(mockEq).toHaveBeenCalledWith("id", "p1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("refuses when there is no signed-in user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await archiveProject("p1");

      expect(result).toEqual({ error: "You must be signed in." });
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteProject", () => {
    it("sets deleted_at/by for the current user, scoped by id", async () => {
      const result = await deleteProject("p1");

      expect(result).toEqual({ error: null });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_by: "u1" }),
      );
      expect(mockUpdate.mock.calls[0]?.[0]).toHaveProperty("deleted_at");
      expect(mockEq).toHaveBeenCalledWith("id", "p1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("returns the database error message on failure", async () => {
      mockEq.mockResolvedValue({ error: { message: "nope" } });

      const result = await deleteProject("p1");

      expect(result).toEqual({ error: "nope" });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("unarchiveProject", () => {
    it("clears the archive columns, scoped by id", async () => {
      const result = await unarchiveProject("p1");

      expect(result).toEqual({ error: null });
      expect(mockUpdate).toHaveBeenCalledWith({
        archived_at: null,
        archived_by: null,
      });
      expect(mockEq).toHaveBeenCalledWith("id", "p1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("returns the database error message on failure", async () => {
      mockEq.mockResolvedValue({ error: { message: "nope" } });

      const result = await unarchiveProject("p1");

      expect(result).toEqual({ error: "nope" });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe("restoreProject", () => {
    it("clears the delete columns, scoped by id", async () => {
      const result = await restoreProject("p1");

      expect(result).toEqual({ error: null });
      expect(mockUpdate).toHaveBeenCalledWith({
        deleted_at: null,
        deleted_by: null,
      });
      expect(mockEq).toHaveBeenCalledWith("id", "p1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/projects");
    });
  });
});
