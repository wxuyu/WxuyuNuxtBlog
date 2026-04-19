// public/sw.ts
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import swConfig from '#sw-config';
const CACHE_NAME = `${swConfig.cachePrefix}-${swConfig.cacheVersion}`;
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);
const shouldHandleRequest = (request) => {
    if (!swConfig.enabled)
        return false;
    const url = new URL(request.url);
    if (request.method !== 'GET')
        return false;
    if (url.protocol === 'chrome-extension:')
        return false;
    return true;
};
registerRoute(({ request, url }) => {
    if (!shouldHandleRequest(request))
        return false;
    const isImage = request.destination === 'image' || /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
    const isFont = request.destination === 'font' || /\.(woff2?|ttf|eot|otf)$/i.test(url.pathname);
    return isImage || isFont;
}, new CacheFirst({
    cacheName: `${CACHE_NAME}-assets`,
    plugins: [
        new ExpirationPlugin({
            maxEntries: swConfig.maxEntries,
            maxAgeSeconds: swConfig.maxAgeSeconds
        })
    ]
}));
registerRoute(({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com', new StaleWhileRevalidate({
    cacheName: `${CACHE_NAME}-google-fonts`,
    plugins: [
        new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 7 * 24 * 60 * 60
        })
    ]
}));
registerRoute(({ request }) => request.destination === 'script' || request.destination === 'style', new NetworkFirst({
    cacheName: `${CACHE_NAME}-resources`,
    plugins: [
        new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60
        })
    ],
    networkTimeoutSeconds: 3
}));
self.addEventListener('message', (event) => {
    if (!event.data)
        return;
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CLEAR_ALL_CACHES':
            event.waitUntil((async () => {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({ type: 'CACHE_CLEARED' });
                });
            })());
            break;
    }
});
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        const validCacheNames = new Set([
            CACHE_NAME,
            `${CACHE_NAME}-assets`,
            `${CACHE_NAME}-google-fonts`,
            `${CACHE_NAME}-resources`
        ]);
        return Promise.all(cacheNames.map(cacheName => {
            if (!validCacheNames.has(cacheName)) {
                return caches.delete(cacheName);
            }
        }));
    })());
});
