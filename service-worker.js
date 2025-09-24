const CACHE_NAME = 'temporizadores-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/alarm.mp3',
    'https://placehold.co/512x512/000000/FFFFFF?text=Icon' 
, '/assets/alarm.wav'];

// Evento de Instalação: Adiciona os arquivos ao cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache).catch(err => console.error('Falha ao adicionar arquivos ao cache:', err));
            })
    );
});

// Evento de Fetch: Serve arquivos do cache ou da rede
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se o arquivo estiver no cache, retorna ele
                if (response) {
                    return response;
                }
                // Senão, busca na rede
                return fetch(event.request);
            })
    );
});

// Evento de Ativação: Limpa caches antigos (opcional, bom para futuras atualizações)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
