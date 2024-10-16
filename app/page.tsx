"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc, setDoc, doc, getDoc } from "firebase/firestore";
import { ref, listAll, getDownloadURL, getStorage } from "firebase/storage"; // Import Firebase Storage functions
import { useEffect, useState, useRef } from "react";
import "react-calendar/dist/Calendar.css"; // Asegúrate de que esta línea esté presente
import { Calendar } from "@nextui-org/react";
import Image from "next/image";
import WebApp from "@twa-dev/sdk"; // Asegúrate de que este import esté presente
import { today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import axios from 'axios';
import OpenAI from "openai";


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

// Create an instance of OpenAIApi
const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

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
  const [loading, setLoading] = useState(false);
  const [equipoA, setEquipoA] = useState<string>("");
  const [equipoB, setEquipoB] = useState<string>("");
  const [competencia, setCompetencia] = useState<string>("");

  // Fetch user data from Telegram Web App
  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      console.log("User Data: ", WebApp.initDataUnsafe.user); // Debug
      setUserData(WebApp.initDataUnsafe.user as UserData);
    } else {
      console.log("No user data available"); // Debug
    }

    fetchImageUrls();
    // Ejemplo de uso: obtener los partidos del 16 de octubre de 2024
  }, []);

  // Handle date change
  const handleDateChange = async (newDate: CalendarDate | null) => {
    if (!newDate) return; // Asegúrate de que newDate no sea null
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
      //await getFixturesByDate(dateKey); // Llama a la función para obtener los fixtures
      await getFixturesByDate('2022-10-19'); // Llama a la función para obtener los fixtures
      setImageUrl(getRandomImage());
      // Llama a generarMensaje después de obtener los datos
      await generarMensaje();
    }

    // Verificar los valores antes de llamar a generarMensaje
    console.log("Equipo A:", equipoA);
    console.log("Equipo B:", equipoB);
    console.log("Competencia:", competencia);

  };


  // API key obtenida al registrarte en football.api-sports.io
  const API_KEY = '5608c120367cf9967e9d177199cc2da7';
  const API_URL = 'https://v3.football.api-sports.io/fixtures';

  // Función para obtener los partidos en una fecha específica
  const getFixturesByDate = async (date: string) => {
    // const leagues = ['39', '140', '135', '78', '2', '1', '13', '61', '3', '71']; // IDs de las ligas: Premier League, La Liga, Serie A, Champions League, Bundesliga, Copa del Mundo, Copa Libertadores, Ligue 1, UEFA Europa League, Brasileirão
    const leagues = ['140']; // IDs de las ligas: Premier League, La Liga, Serie A, Champions League, Bundesliga, Copa del Mundo, Copa Libertadores, Ligue 1, UEFA Europa League, Brasileirão
    try {
      for (const league of leagues) {
        const response = await axios.get(API_URL, {
          headers: {
            'x-apisports-key': API_KEY,  // Clave API
            'Content-Type': 'application/json',
          },
          params: {
            date: date,           // Fecha específica en formato YYYY-MM-DD
            league: league,       // Llamada por cada liga
            season: '2022'       // Temporada
          },
        });

        // Procesar la respuesta
        const fixtures = response.data.response;

        fixtures.forEach((fixture: any) => {
          const homeTeam = fixture.teams.home.name;
          const awayTeam = fixture.teams.away.name;
          const matchTime = fixture.fixture.date;
          console.log(`${homeTeam} vs ${awayTeam} - ${matchTime}`); // Imprime la información de los partidos

          // Asigna los valores a las variables de estado
          setEquipoA(homeTeam);
          setEquipoB(awayTeam);
          setCompetencia(fixture.league.name); // Asumiendo que el nombre de la liga está aquí
        });
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
    }
  };

  const generarMensaje = async () => {
    const systemPrompt = `
        Yo soy tipster deportivo y tengo un canal donde comparto análisis y pronósticos de partidos de fútbol. Genera un mensaje para mi canal de Telegram motivacional de buenos días como un tipster especializado en apuestas deportivas de futbol. Usa los datos específicos de los partidos del día que te serán indicados y crea un mensaje que siga el mismo estilo de los ejemplos proporcionados.

            # Pasos
              
            1. **Motivación Matutina**:
              - Inicia el mensaje con un saludo motivacional. Haz uso de emoticonos como ☀️ o 🌞 para un toque positivo.
              - Refuerza la energía y entusiasmo al empezar la jornada. Utiliza términos como "con toda la energía", "pilas a tope", y "jornada espectacular".

            2. **Análisis de Partidos**:
              - Menciona que hay enfrentamientos importantes y que el análisis es clave para ganar.
              - Ház sentir al lector parte de un equipo listo para el éxito.

            4. **Cierre Positivo**: 
              - Termina con un ánimo positivo, instando al equipo a triunfar en las apuestas del día y un CTA. 

            # Formato de Salida

            El mensaje debe ser un párrafo motivacional breve, que incluya un saludo matutino, un buen resumen de los partidos mas importantes del día con un enfoque positivo,  y un cierre optimista.

              # Entrada de Ejemplo:
                    - Partido: {equipoA} vs {equipoB}
                    - Liga o Competicion: {competencia}

            # Ejemplos

            **Ejemplo Manteniendo el Estilo:**

                  🌞 ¡Buenos días equipo! Hoy es [DÍA DE LA SEMANA] y venimos con toda la energía para un día lleno de oportunidades. 💪 
                  La jornada promete con varios encuentros clave, y juntos lo lograremos con el análisis preciso que hemos preparado. ¡A por ello!
                  ¡Con enfoque y dedicación, hoy conquistamos las apuestas!



            # Notas

            - Asegúrate de personalizar los mensajes de acuerdo con los detalles específicos de cada partido.
            - Usa un lenguaje coherente y enérgico para replicar fielmente el estilo marcado en los ejemplos.
    `;

    const userInput = `
      Partido: ${equipoA} vs ${equipoB}
      Liga o Competicion:: ${competencia}
    `;
    setLoading(true);
    try {
      console.log("JORGE " , userInput);
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
      //  max_tokens: 300,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      setTextField(response.choices[0].message?.content.trim());

    } catch (error) {
      console.error("Error al generar el mensaje:", error);
    } finally {
      setLoading(false);
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
    const randomMinutes = Math.floor(Math.random() * 54); // Random minutes between 0 and 59
    const scheduledTime = `${dateKey}T09:${randomMinutes}:00`; // Schedule for 9 AM with random minutes

    console.log("Fecha seleccionada para guardar: ", dateKey); // Debug para la fecha
    console.log("Texto: ", textField); // Debug para el texto
    console.log("URL de imagen: ", imageUrl); // Debug para la imagen
    console.log("Scheduled Time: ", scheduledTime); // Debug for scheduled time

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
          scheduledTime: scheduledTime, // Add scheduled time
          sent: false, // Flag to indicate if the message has been sent
        });
        console.log("Mensaje guardado correctamente y programado a", dateKey, scheduledTime);
        setMessage("Data saved successfully!");
        alert("Mensaje guardado correctamente y programado a"); // Pop-up de confirmación
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    console.log("JORGE", textareaRef.current);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [textField]); // Ensure this effect runs whenever `textField` changes


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2 bg-gray-100">
      <h1 className="text-2xl font-bold text-gray-500">BetExperts Latino</h1>

      <div className="flex flex-col items-center bg-white shadow-lg rounded-lg p-6 mt-4 w-full max-w-md">
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
          ref={textareaRef}
          value={textField}
          onChange={(e) => setTextField(e.target.value)}
          className="w-full h-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
          placeholder="El texto se autogenera..."
          style={{ height: "auto" }} // Ensure initial height is set to auto
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
