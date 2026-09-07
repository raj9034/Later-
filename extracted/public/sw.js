// Later Service Worker for Calm Memory Recall & Web Push
const SW_VERSION = 'later-sw-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Receive background Web Push payload from server when tab/browser is closed
self.addEventListener('push', (event) => {
  let pushData = {
    title: 'Something you wanted to remember',
    body: 'You have a saved memory ready in Later.',
    tag: 'later-calm-memory',
    data: { surfaceMemory: true },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      pushData = {
        title: parsed.title || pushData.title,
        body: parsed.body || pushData.body,
        tag: parsed.tag || pushData.tag,
        data: parsed.data || pushData.data,
      };
    } catch {
      const text = event.data.text();
      if (text) {
        pushData.body = text;
      }
    }
  }

  const notificationOptions = {
    body: pushData.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: pushData.tag ? `${pushData.tag}-${Date.now()}` : `later-memory-${Date.now()}`,
    renotify: true,
    silent: false,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    data: pushData.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, notificationOptions)
  );
});

// 2. Receive in-tab direct notification dispatch from Later client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_CALM_NOTIFICATION') {
    const { title, body, tag, data } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Something you wanted to remember', {
        body: body || 'You have memories ready in Later.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: tag ? `${tag}-${Date.now()}` : `later-memory-${Date.now()}`,
        renotify: true,
        silent: false,
        vibrate: [100, 50, 100],
        requireInteraction: false,
        data: data || {},
      })
    );
  }
});

// 3. Handle clicking on notification - brings Later to focus and surfaces the Memory Moment
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetData = event.notification.data || {};
  const targetUrl = targetData.firstItemId
    ? `/?surfaceMemory=true&itemId=${encodeURIComponent(targetData.firstItemId)}`
    : '/?surfaceMemory=true';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an existing window/tab of Later is open, focus it and broadcast event
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'postMessage' in focusedClient) {
              focusedClient.postMessage({
                type: 'SURFACE_MEMORY_MOMENT',
                data: targetData,
              });
            }
          });
        }
      }

      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
