declare module '#sw-config' {
  export interface SWConfig {
    enabled: boolean;
    cachePrefix: string;
    cacheVersion: string;
    maxAgeSeconds: number;
    maxEntries: number;
    extraFileTypes: string[];
  }
  const config: SWConfig;
  export default config;
}