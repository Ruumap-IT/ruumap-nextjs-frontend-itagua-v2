import Dexie, { type EntityTable } from 'dexie';

export interface MediaAsset {
  url: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

// Bump this whenever the shape of the mapped `ProjectData`/`Unit` objects
// changes in a way old cached entries wouldn't match (field moved/renamed,
// etc). Cached records stamped with an older version are treated as a
// cache miss instead of being served stale-shaped — see project.service.ts.
export const PROJECT_CACHE_SCHEMA_VERSION = 2; // v2: show_price moved from Unit to Project

export interface CachedProject {
  slug: string;
  data: any;
  updatedAt: number;
  schemaVersion?: number;
}

const db = new Dexie('ruumap-offline-db') as Dexie & {
  assets: EntityTable<MediaAsset, 'url'>;
  projects: EntityTable<CachedProject, 'slug'>;
};

db.version(1).stores({
  assets: 'url',
  projects: 'slug'
});

export { db };
