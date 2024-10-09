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

export default async function handler(req, res) {
  const now = new Date();
  const messagesRef = collection(db, "mensajesBuenosDias");
  const snapshot = await getDocs(messagesRef);

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const scheduledTime = new Date(data.scheduledTime);
    //const YOUR_BOT_TOKEN = '8106664155:AAEbLO9kcy0ehQyxvztLtw8vIntwSszkkjY';
    const chatId = '-1002356737756';

    //if (!data.sent && scheduledTime <= now) {
      try {
        // Send message to Telegram channel
        await axios.post(`https://api.telegram.org/bot8106664155:AAEbLO9kcy0ehQyxvztLtw8vIntwSszkkjY/sendMessage`, {
          chat_id: chatId,
          text: data.text,
        });

        // Update Firestore document to mark as sent
        await updateDoc(doc.ref, { sent: true });
        console.log(`Message sent for date: ${data.date}`);
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    //}
  });

  res.status(200).json({ message: "Scheduled messages processed" });
}


