const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, updateDoc } = require("firebase/firestore");
const axios = require("axios");

const firebaseConfig = {
  apiKey: "AIzaSyBGBlSmL5WDTCnjjzgbMdmwNYZmw4Y3Fgk",
  authDomain: "betexpert-latino.firebaseapp.com",
  projectId: "betexpert-latino",
  storageBucket: "betexpert-latino.appspot.com",
  messagingSenderId: "713344855947",
  appId: "1:713344855947:web:3aa4f8a93b89e8ea9b898e",
  measurementId: "G-939C0DNPP7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TELEGRAM_BOT_TOKEN = "8106664155:AAEbLO9kcy0ehQyxvztLtw8vIntwSszkkjY"; // Reemplaza esto con tu token de bot de Telegram
const TELEGRAM_CHAT_ID = "-1002356737756"; // Reemplaza esto con el chat ID donde quieres enviar el mensaje


export default async function handler(req, res) {
  console.log("LLAMA A CRONJOB");
  const now = new Date();
  const messagesRef = collection(db, "mensajesBuenosDias");
  const snapshot = await getDocs(messagesRef);
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const scheduledTime = new Date(data.scheduledTime);

    if (!data.sent && scheduledTime <= now) {
      try {
        // Send message to Telegram channel
        const photoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        await axios.post(photoUrl, {
          chat_id: TELEGRAM_CHAT_ID,
          photo: data.imageUrl,
        });

        await axios.post(url, {
          chat_id: TELEGRAM_CHAT_ID,
          text: data.text,
        });

        // Update Firestore document to mark as sent
        await updateDoc(doc.ref, { sent: true });
        console.log(`Message sent for date: ${data.date}`);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  });

  res.status(200).json({ message: "Scheduled messages processed" });
}


