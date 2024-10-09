import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import axios from "axios";

const db = getFirestore();

export default async function handler(req, res) {
  const now = new Date();
  const messagesRef = collection(db, "mensajesBuenosDias");
  const snapshot = await getDocs(messagesRef);

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    const scheduledTime = new Date(data.scheduledTime);
    //const YOUR_BOT_TOKEN = '8106664155:AAEbLO9kcy0ehQyxvztLtw8vIntwSszkkjY';
    const chatId = '1002356737756';

    if (!data.sent && scheduledTime <= now) {
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
    }
  });

  res.status(200).json({ message: "Scheduled messages processed" });
}


