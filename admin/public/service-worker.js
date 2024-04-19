// Push notification handler
self.addEventListener('push', (event) => {
  // No ? operator because of Mobile Chrome on Android :(
  let data = {};
  if (event && event.data && event.data.text) {
    data = JSON.parse(event.data.text());
  }
  const options = {
    body: data.body || 'Attention!',
    icon: '/favicon/android-chrome-512x512.png',
  };
  event.waitUntil(
    self.registration.showNotification(`Caleo Pro: ${data.title}`, options)
  );
});

self.addEventListener('message', (event) => {
  const { type } = JSON.parse(event.data);
  switch(type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'REMOVE_ALL_NOTIFICATIONS':
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((notification) => {
          notification.close();
        });
      });
      break;
    default:
      break;
  }
});
