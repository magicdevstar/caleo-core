// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event?.data?.text() || 'Attention!',
    icon: '/favicon/android-chrome-512x512.png',
  };
  event.waitUntil(
    self.registration.showNotification('Caleo Pro', options)
  );
});