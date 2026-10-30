const CACHE = "soukoul-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/manifest.json"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Soukoul", body: "Nouvelle notification" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    data = { title: "Soukoul", body: event.data ? event.data.text() : data.body };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Soukoul", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    }),
  );
});
