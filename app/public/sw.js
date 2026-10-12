self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "Lãnh Đạo Khai Tâm";
  const options = {
    body: payload.body || "Bạn có một hoạt động đang chờ.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || "ldkt-reminder",
    renotify: false,
  };

  const work = [self.registration.showNotification(title, options)];
  const shouldSetBadge = payload.type === "challenge" || payload.type === "test";
  if (shouldSetBadge && "setAppBadge" in self.navigator) {
    work.push(self.navigator.setAppBadge(1));
  }
  event.waitUntil(Promise.allSettled(work));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return clients.openWindow(targetUrl);
    }),
  );
});
