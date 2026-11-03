const CACHE_NAME = "pausa-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalación: Guardar archivos esenciales en caché
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptación de peticiones (Network First con respaldo en Caché)
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Si la respuesta es válida, la actualizamos en caché de forma dinámica
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Manejo de clics en las notificaciones push
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientsList => {
        if (clientsList.length) {
          return clientsList[0].focus();
        }
        return self.clients.openWindow("./index.html");
      })
  );
});
