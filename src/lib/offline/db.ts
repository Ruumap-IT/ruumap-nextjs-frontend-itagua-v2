import Dexie, { type EntityTable } from 'dexie';

export interface MediaAsset {
  url: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface CachedProject {
  slug: string;
  data: any;
  updatedAt: number;
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
