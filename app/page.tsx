"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc, setDoc, doc, getDoc } from "firebase/firestore";
import { ref, listAll, getDownloadURL, getStorage } from "firebase/storage"; // Import Firebase Storage functions
import { useEffect, useState } from "react";
import "react-calendar/dist/Calendar.css"; // Asegúrate de que esta línea esté presente
import { Calendar } from "@nextui-org/react";
import Image from "next/image";
import WebApp from "@twa-dev/sdk"; // Asegúrate de que este import esté presente
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";

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
const db = getFirestore();

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  photo_url?: string;
  is_premium?: boolean;
}

export default function Page() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [textField, setTextField] = useState<string>("");
  const [date, setDate] = useState<CalendarDate>(new CalendarDate(2024, 9, 17));
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Fetch user data from Telegram Web App
  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      console.log("User Data: ", WebApp.initDataUnsafe.user); // Debug
      setUserData(WebApp.initDataUnsafe.user as UserData);
    } else {
      console.log("No user data available"); // Debug
    }
    fetchImageUrls();
  }, []);

  // Handle date change
  const handleDateChange = async (newDate: CalendarDate | null) => {
    //if (!newDate) return;
    setDate(newDate);

    const dateKey = newDate.toString().split("T")[0]; // Format date as YYYY-MM-DD
    console.log("Selected Date: ", dateKey); // Debug

    const docRef = doc(db, "mensajesBuenosDias", dateKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Document data EXISTE YA EN LA BBDD CON ESTA FECHA: ", data); // Debug
      setTextField(data.text);
      setImageUrl(data.imageUrl);
    } else {
      console.log("No document found for the selected date"); // Debug
      setTextField("Vacio");
      setImageUrl(getRandomImage());
    }
  };

  const fetchImageUrls = async () => {
    const storageRef = ref(getStorage(), "buenosDiasImages");
    const listResult = await listAll(storageRef);
    console.log("List of Images: ", listResult); // Debug

    const urls = await Promise.all(
      listResult.items.map(async (item) => await getDownloadURL(item))
    );
    console.log("Image URLs: ", urls); // Debug
    setImageUrls(urls);
    setImageUrl(getRandomImage());
  };

  // Get a random image from the list
  const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    console.log("Random Image Index: ", randomIndex); // Debug
    return imageUrls[randomIndex];
  };

  // Save image and text to Firestore
  const handleSave = async () => {
    const dateKey = date.toString().split("T")[0];

    console.log("Fecha seleccionada para guardar: ", dateKey); // Debug para la fecha
    console.log("Texto: ", textField); // Debug para el texto
    console.log("URL de imagen: ", imageUrl); // Debug para la imagen

    // Si no hay imagen, asigna una aleatoria
    if (imageUrl.length === 0) {
      setImageUrl(getRandomImage());
      console.log("Asignando imagen aleatoria: ", imageUrl); // Debug de la imagen
    }
    if (textField && imageUrl && dateKey) {
      try {
        const docRef = doc(db, "mensajesBuenosDias", dateKey);
        await setDoc(docRef, {
          text: textField,
          imageUrl: imageUrl,
          date: dateKey,
        });
        console.log("Data saved successfully!");
        setMessage("Data saved successfully!");
        alert("Mensaje guardado correctamente!"); // Pop-up de confirmación
      } catch (error) {
        console.log("Error al guardar los datos en Firestore: ", error); // Debug de errores
        console.error("Error details: ", JSON.stringify(error, null, 2));
        console.error("Error al guardar los datos en Firestore: ", error); // Debug de errores
      }
    } else {
      console.error("Algunos datos están vacíos");
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    console.log("Modal state: ", isModalOpen ? "Closed" : "Opened"); // Debug
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <h1 className="text-3xl font-semibold text-gray-800">
        BettingExperts Latino
      </h1>
      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6 mt-6 w-full max-w-md">
        <Calendar
          aria-label="Date (Max Date Value)"
          defaultValue={today(getLocalTimeZone())}
          onFocusChange={handleDateChange}
          minValue={today(getLocalTimeZone())}
          className="mb-4"
        />

        <div className="relative w-full h-48 p-2 border border-gray-300 mb-6">
          <Image
            src={imageUrl}
            alt="User"
            width={500}
            height={200}
            onClick={toggleModal}
            className="w-full h-full"
          />
          <button
            onClick={() => setImageUrl(getRandomImage())}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-500 text-white rounded-xl hover:bg-blue-600 transition h-full"
            aria-label="Refresh Image"
          >
            🔄
          </button>
        </div>

        <textarea
          value={textField}
          onChange={(e) => setTextField(e.target.value)}
          className="w-full h-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
          placeholder="Enter text..."
        />

        <button
          onClick={handleSave}
          className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Save
        </button>

        {message && <p className="mt-4 text-green-600">{message}</p>}
      </div>

      {userData ? (
        <div className="mt-6 text-gray-700">
          <p>Hola, {userData.first_name}</p>
        </div>
      ) : (
        <p className="mt-6 text-gray-500">
          Cargando... | Unable to fetch user data
        </p>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
          onClick={toggleModal}
        >
          <Image
            src={imageUrl}
            alt="Imagen completa"
            width={500}
            height={300}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
