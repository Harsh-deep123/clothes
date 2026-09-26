/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOMINATIM_URL?: string;
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_MAP_TILE_ATTR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
