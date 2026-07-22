/**
 * IndexedDB mirror of the signed-in user's projects.
 *
 * The server component is the source of truth: after each render its list is
 * written through to IndexedDB with {@link saveCachedProjects}. The cache is
 * read back with {@link getCachedProjects} to paint instantly while offline.
 * Every operation is a best-effort no-op when IndexedDB is unavailable (server
 * rendering, private-mode restrictions), so callers never need to guard.
 */

import type { Project } from "@/lib/projects";

const DB_NAME = "playground";
const DB_VERSION = 1;
const STORE = "projects";

/**
 * Whether IndexedDB can be used in the current environment.
 * @returns {boolean} `true` in a browser with IndexedDB support.
 */
function isAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

/**
 * Open (and lazily create) the projects database.
 * @returns {Promise<IDBDatabase>} The opened database handle.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (): void => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = (): void => resolve(request.result);
    request.onerror = (): void => reject(request.error);
  });
}

/**
 * Read the cached projects, newest first. Returns an empty list when the cache
 * is empty or IndexedDB is unavailable — it never throws.
 * @returns {Promise<Project[]>} The cached projects.
 */
export async function getCachedProjects(): Promise<Project[]> {
  if (!isAvailable()) {
    return [];
  }
  try {
    const db = await openDb();
    const projects = await new Promise<Project[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = (): void => resolve(request.result as Project[]);
      request.onerror = (): void => reject(request.error);
      tx.oncomplete = (): void => db.close();
    });
    return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

/**
 * Replace the cached projects with the given list (clearing removed rows). A
 * best-effort mirror of server truth; failures are swallowed.
 * @param {Project[]} projects - The authoritative list to persist.
 * @returns {Promise<void>} Resolves once the write settles.
 */
export async function saveCachedProjects(projects: Project[]): Promise<void> {
  if (!isAvailable()) {
    return;
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      for (const project of projects) {
        store.put(project);
      }
      tx.oncomplete = (): void => {
        db.close();
        resolve();
      };
      tx.onerror = (): void => reject(tx.error);
    });
  } catch {
    // Best-effort cache; a failed write just leaves the previous mirror.
  }
}
