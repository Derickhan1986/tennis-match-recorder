//
//  Service Worker for Tennis Match Recorder PWA
//  网球比赛记录器PWA的服务工作者
//
//  Handles offline functionality and caching
//  处理离线功能和缓存
//

const CACHE_NAME = 'tennis-match-recorder-v1';
const STATIC_CACHE = 'tennis-static-v1';

// Install event - cache static assets
// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/styles.css',
                '/js/app.js',
                '/js/storage.js',
                '/js/models.js',
                '/js/match-engine.js',
                '/js/player-manager.js',
                '/js/match-recorder.js',
                '/manifest.json'
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
// 获取事件 - 从缓存提供，回退到网络
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    // 只缓存GET请求
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached version or fetch from network
            // 返回缓存版本或从网络获取
            return response || fetch(event.request).then((fetchResponse) => {
                // Don't cache non-successful responses
                // 不缓存不成功的响应
                if (!fetchResponse || fetchResponse.status !== 200) {
                    return fetchResponse;
                }

                // Clone the response for caching
                // 克隆响应以进行缓存
                const responseToCache = fetchResponse.clone();

                caches.open(STATIC_CACHE).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return fetchResponse;
            });
        })
    );
});

// Message event - handle messages from main thread
// 消息事件 - 处理来自主线程的消息
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

