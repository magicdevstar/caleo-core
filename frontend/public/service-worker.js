// Push notification handler
self.addEventListener('push', (event) => {
  const data = JSON.parse(event?.data?.text());
  const options = {
    body: data?.body || 'Attention!',
    icon: '/favicon/android-chrome-512x512.png',
  };
  console.log('Push event', event);
  event.waitUntil(
    self.registration.showNotification(`Caleo Pro: ${data?.title}`, options)
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
