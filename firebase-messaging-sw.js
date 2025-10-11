// This file must be in the public root of your web app.
// It's responsible for receiving and displaying push notifications when the app is in the background.

// Import Firebase SDKs using the compat libraries for broader browser support in service workers.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Your web app's Firebase configuration, copied from config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCHEfpkAnnBlV4Mld00SyJuq7616mB2xcg",
  authDomain: "dccc1-7f7d9.firebaseapp.com",
  projectId: "dccc1-7f7d9",
  storageBucket: "dccc1-7f7d9.firebasestorage.app",
  messagingSenderId: "180038595763",
  appId: "1:180038595763:web:37ec984c4a9e8ee547ecc6",
  databaseURL: "https://dccc1-7f7d9-default-rtdb.firebaseio.com/",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message ', payload);

  if (!payload.notification) {
    console.log("[SW] No notification payload in message, skipping display.");
    return;
  }

  // Customize the notification here
  const notificationTitle = payload.notification.title || 'New Message';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new message from DCCC.',
    icon: 'https://res.cloudinary.com/dabfeqgsj/image/upload/v1759778648/cyizstrjgcq0w9fr8cxp.png',
    data: {
      url: payload.fcmOptions?.link || self.location.origin, // Use link from FCM or open the site root
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// This event is fired when the user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  // Get the URL from the notification data, default to the app's origin
  const urlToOpen = clickedNotification.data.url || self.location.origin;

  // Check if a window is already open with the same URL and focus it. Otherwise, open a new window.
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      // Check if the client's URL matches the notification's URL
      // A simple check is to see if the pathname matches
      const clientUrl = new URL(windowClient.url);
      const targetUrl = new URL(urlToOpen);
      if (clientUrl.pathname === targetUrl.pathname) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});