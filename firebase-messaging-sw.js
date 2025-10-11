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
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize the notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
