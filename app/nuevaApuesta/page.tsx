"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import axios from 'axios';
import Image from "next/image";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import dotenv from 'dotenv';
import leagues from '../../data/leagues.json';
import leaguesIDName from '../../data/leaguesIDName.json';

// Cargar las variables de entorno
dotenv.config();

const GOOGLE_API_KEY = 'AIzaSyBqBYaTcKqtgCtYgTeRxZZZel30IoLxL1Q';
const GOOGLE_CX = 'e3eff5474587546a7';

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

const TELEGRAM_BOT_TOKEN = "8106664155:AAEbLO9kcy0ehQyxvztLtw8vIntwSszkkjY"; // Reemplaza esto con tu token de bot de Telegram
const TELEGRAM_CHAT_ID = "-1002356737756"; // Reemplaza esto con el chat ID donde quieres enviar el mensaje

// Create an instance of OpenAIApi
const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

// Define the expected structure of the leagues data
/*interface LeagueResponse {
  response: {
    league: {
      id: number;
      name: string;
      type: string;
    };
    country: {
      name: string;
    };
  }[];
}*/

// Convertir el mapa a un array de nombres asegurando que son cadenas
const competiciones = Object.values(leaguesIDName).map(value => String(value));

// Lista de equipos (puedes reemplazar esto con tus datos reales)
const equipos = ["Equipo A", "Equipo B", "Equipo C", "Equipo D"];

// Función para filtrar opciones
const filterOptions = (options: string[], query: string) => {
  return options.filter(option => option.toLowerCase().includes(query.toLowerCase()));
};

export default function NuevaApuesta() {
  const [loading, setLoading] = useState(false);
  const [equipoA, setEquipoA] = useState<string>("");
  const [equipoB, setEquipoB] = useState<string>("");
  const [competencia, setCompetencia] = useState<string>("");
  const [cuota, setCuota] = useState<string>("");
  const [stake, setStake] = useState<string>("");
  const [analisis, setAnalisis] = useState<string>("");
  const [recomendacion, setRecomendacion] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [googleImageUrls, setGoogleImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Nuevos estados para el segundo partido
  const [equipoC, setEquipoC] = useState<string>("");
  const [equipoD, setEquipoD] = useState<string>("");
  const [competencia2, setCompetencia2] = useState<string>("");
  const [showSecondMatch, setShowSecondMatch] = useState<boolean>(false); // Estado para controlar la visibilidad

  const fetchImageUrls = async () => {
    const storageRef = ref(getStorage(), "pronosticosGratuitosImages");
    const listResult = await listAll(storageRef);
    console.log("List of Images: ", listResult); // Debug

    const urls = await Promise.all(
      listResult.items.map(async (item) => await getDownloadURL(item))
    );
    console.log("Image URLs: ", urls); // Debug
    setImageUrls(urls);
    setImageUrl(getRandomImage(urls));
  };

  const getRandomImage = (urls: string[]) => {
    const randomIndex = Math.floor(Math.random() * urls.length);
    console.log("Random Image Index: ", randomIndex); // Debug
    return urls[randomIndex];
  };

  useEffect(() => {
    fetchImageUrls();

   /* // Creamos el mapa para almacenar los resultados
    const leagueMap = new Map();
    const jsonData = leagues as LeagueResponse; // Assert the type here
    const leagueJson: { [key: number]: string } = {}; // Objeto para almacenar el JSON

    // Recorremos cada elemento de la respuesta
    jsonData.response.forEach(item => {
      const leagueId = item.league.id;  // Key: ID de la liga
      const leagueInfo = `${item.country.name} - ${item.league.name} - ${item.league.type}`;  // Value: country.name - league.name - league.type

      // Guardamos en el mapa
      leagueMap.set(leagueId, leagueInfo);
      leagueJson[leagueId] = leagueInfo; // Guardamos en el objeto JSON
    });

    // Convertir el objeto a JSON
    const leagueJsonString = JSON.stringify(leagueJson, null, 2);
    console.log("JSON de ligas:", leagueJsonString); // Muestra el JSON en la consola*/

    // Muestra el mapa en la consola
    /*leagueMap.forEach((value, key) => {
      console.log(`ID: ${key}, Info: ${value}`);
    });*/
  }, []);

  /**
   * Función para buscar imágenes en Google Images.
   * @param query - Nombre del equipo u otro término de búsqueda
   * @returns La URL de la primera imagen encontrada o un mensaje de error
   */
  async function buscarImagenEnGoogle(query: string): Promise<string[]> {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&num=3`;

      const response = await axios.get(url);
      const items = response.data.items;

      if (items && items.length > 0) {
        return items.map((item: any) => item.link);
      } else {
        console.error('No se encontraron imágenes.');
        return [];
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error al buscar la imagen:', error.message);
        console.error('Detalles del error:', error.response?.data);
      } else {
        console.error('Error inesperado:', error);
      }
      return [];
    }
  }

  const generarMensaje = async () => {
    const systemPrompt = `
      Yo soy tipster deportivo y tengo un canal donde comparto análisis y pronósticos de partidos de fútbol. Genera un mensaje para mi canal de Telegram para el análisis y pronóstico de un partido de fútbol replicando el estilo de los ejemplos proporcionados. Usa los datos específicos del partido que te serán indicados.

      # Detalles

      - Proporciona un inicio motivador y energizante que anime al receptor del mensaje.
      - Explica algunos detalles del contexto del partido, incluyendo estadísticas relevantes, eventos recientes relacionados con los equipos...
      - Concluye con una apuesta gratuita, mostrando los detalles de la competición, el stake, la cuota, y una recomendación específica.

      # Plantilla de Mensaje

      1. **Saludos Motivadores:**
         - Comienza con un saludo entusiasta para captar la atención del receptor del mensaje.

      2. **Análisis Contextual:**
         - Incluye estadísticas, noticias o consideraciones recientes sobre ambos equipos.
         - Usa un tono positivo y convencedor para motivar la confianza en la apuesta sugerida.
         - Utiliza la informacion contenida en {analisis}

      3. **Apuesta Sugerida:**
         - Usa símbolos y emojis para hacer el mensaje más atractivo.
         - Incluye claramente todos los datos del partido en formato estructurado.

      # Entrada de Ejemplo:
        - Partido: {equipoA} vs {equipoB} y {equipoC} vs {equipoD}
        - Competición: {competencia} y {competencia2}
        - Cuota: {cuota}
        - Stake: {stake}
        - Resultado del análisis: {analisis}
        - Apuesta sugerida: {recomendacion}.


      # Ejemplo de salida 1:
      🌞 ¡Saludos equipo! Hoy salimos al campo llenos de energía y con determinación para romper la jornada. Nos enfrentamos a un emocionante partido entre {equipoA} y {equipoB}, y estamos listos para aprovechar nuestra predicción ganadora. 🏆
      🌞 ¡Saludos equipo! Hoy salimos al campo llenos de energía y con determinación para romper la jornada. Nos enfrentamos a un emocionante partido entre {equipoA} y {equipoB}, y {equipoC} y {equipoD}, y estamos listos para aprovechar nuestra predicción ganadora. 🏆

      🍀 Apuesta Gratuita 🍀  
      🇪🇸 {competencia}  
      🇪🇸 {competencia} y {competencia2}  
      🔘 STAKE {stake} ⚡️Cuota {cuota}⚡️  
      💡 Recomendamos: {recomendacion}

      ¡Vamos con todo equipo, las ganancias nos esperan hoy! 🎯

      # Notas

      - Asegúrate de personalizar los mensajes de acuerdo con los detalles específicos de cada partido.
      - Usa un lenguaje coherente y enérgico para replicar fielmente el estilo marcado en los ejemplos.
    `;

    const userInput = `
      Partido: ${equipoA} vs ${equipoB} ${showSecondMatch ? `y ${equipoC} vs ${equipoD}` : ""}
      Competición: ${competencia} ${showSecondMatch ? `y ${competencia2}` : ""}
      Cuota: ${cuota}
      Stake: ${stake}
      Análisis: ${analisis}
      Recomendación: ${recomendacion}
    `;
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      setMessage(response.choices[0].message?.content.trim());

      // Realizar búsquedas de imágenes con diferentes consultas
      const query1 = `${equipoA} vs ${equipoB}`;
      const query2 = `${competencia}`;
      const queries = [query1, query2]; // Inicializar con las consultas del primer partido

      if (showSecondMatch) {
        const query3 = `${equipoC} vs ${equipoD}`;
        const query4 = `${competencia2}`;
        queries.push(query3, query4); // Agregar consultas del segundo partido
        queries.push(`jugadores de ${equipoC}`, `jugadores de ${equipoD}`); // Agregar jugadores del segundo partido
      }
      queries.push(`jugadores de ${equipoA}`, `jugadores de ${equipoB}`); // Agregar jugadores del primer partido

      console.log(queries);

      try {
        const imagenesGoogleAPIUrls = await Promise.all(queries.map(query => buscarImagenEnGoogle(query)));
        const flattenedImages = imagenesGoogleAPIUrls.flat(); // Aplanar el array de imágenes
        if (flattenedImages.length > 0) {
          setGoogleImageUrls(flattenedImages);
          setCurrentImageIndex(0);
          console.log(`Imágenes encontradas: ${flattenedImages}`);
        } else {
          console.log('No se encontraron imágenes.');
        }
      } catch (error) {
        console.error("Error al buscar imágenes:", error);
      }
    } catch (error) {
      console.error("Error al generar el mensaje:", error);
    } finally {
      setLoading(false);
    }
  };

  const enviarATelegram = async () => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {

      // Envio imagen de Apuesta Gratuita a telegram
      const photoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      await axios.post(photoUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: imageUrl,
      });

      // Envio de imagen sobre el partido obtenida de la API de Google a telegram
      await axios.post(photoUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: googleImageUrls[currentImageIndex], // Cambiado para usar la imagen seleccionada de Google
      });

      // lógica para enviar el mensaje al canal de Telegram
      await axios.post(url, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      });

      console.log("Mensaje enviado a Telegram:", message);
      alert("Mensaje enviado correctamente al canal!");
    } catch (error) {
      console.error("Error enviando mensaje a Telegram:", error);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    console.log("JORGE", textareaRef.current);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [message]); // Ensure this effect runs whenever `message` changes



  return (
    <div className="flex flex-col items-center justify-top min-h-screen p-2 bg-gray-100">
      <h1 className="text-xl font-bold mb-6 text-blue-600">Generador de Pronósticos Gratuitos</h1>
      <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md space-y-4">

        <div className="relative w-full h-48 mb-2">
          <Image
            src={imageUrl}
            alt="User"
            width={500}
            height={200}
            onClick={() => setImageUrl(getRandomImage(imageUrls))}
            className="w-full h-full"
          />
          <button
            onClick={() => setImageUrl(getRandomImage(imageUrls))}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-500 text-white rounded-xl hover:bg-blue-600 transition h-full"
            aria-label="Refresh Image"
          >
            🔄
          </button>
        </div>

        <input
          type="text"
          placeholder="Equipo A"
          value={equipoA}
          onChange={(e) => setEquipoA(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Autocompletado para Equipo A */}
        {equipoA && (
          <ul className="absolute bg-white border border-gray-300 rounded-md w-full z-10">
            {filterOptions(equipos, equipoA).map((equipo) => (
              <li key={equipo} onClick={() => setEquipoA(equipo)} className="p-2 hover:bg-gray-200 cursor-pointer">
                {equipo}
              </li>
            ))}
          </ul>
        )}

        <input
          type="text"
          placeholder="Equipo B"
          value={equipoB}
          onChange={(e) => setEquipoB(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Autocompletado para Equipo B */}
        {equipoB && (
          <ul className="absolute bg-white border border-gray-300 rounded-md w-full z-10">
            {filterOptions(equipos, equipoB).map((equipo) => (
              <li key={equipo} onClick={() => setEquipoB(equipo)} className="p-2 hover:bg-gray-200 cursor-pointer">
                {equipo}
              </li>
            ))}
          </ul>
        )}

        <input
          type="text"
          placeholder="Competición"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* Autocompletado para Competición */}
        {competencia && (
          <ul className="absolute bg-white border border-gray-300 rounded-md w-full z-10">
            {filterOptions(competiciones, competencia).map((comp) => (
              <li key={comp} onClick={() => setCompetencia(comp)} className="p-2 hover:bg-gray-200 cursor-pointer">
                {comp}
              </li>
            ))}
          </ul>
        )}

        {/* Botón para mostrar los campos del segundo partido */}
        <button
          onClick={() => setShowSecondMatch(!showSecondMatch)}
          className={`w-full py-1 rounded-md transition-colors ${showSecondMatch ? "bg-red-300" : "bg-green-300"} text-white hover:bg-opacity-80`}
        >
          {showSecondMatch ? "Ocultar Segundo Partido" : "Añadir Segundo Partido"}
        </button>

        {/* Campos del segundo partido */}
        {showSecondMatch && (
          <>
            <input
              type="text"
              placeholder="Equipo C"
              value={equipoC}
              onChange={(e) => setEquipoC(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Autocompletado para Equipo C */}
            {equipoC && (
              <ul className="absolute bg-white border border-gray-300 rounded-md w-full z-10">
                {filterOptions(equipos, equipoC).map((equipo) => (
                  <li key={equipo} onClick={() => setEquipoC(equipo)} className="p-2 hover:bg-gray-200 cursor-pointer">
                    {equipo}
                  </li>
                ))}
              </ul>
            )}

            <input
              type="text"
              placeholder="Equipo D"
              value={equipoD}
              onChange={(e) => setEquipoD(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Autocompletado para Equipo D */}
            {equipoD && (
              <ul className="absolute bg-white border border-gray-300 rounded-md w-full z-10">
                {filterOptions(equipos, equipoD).map((equipo) => (
                  <li key={equipo} onClick={() => setEquipoD(equipo)} className="p-2 hover:bg-gray-200 cursor-pointer">
                    {equipo}
                  </li>
                ))}
              </ul>
            )}

            <input
              type="text"
              placeholder="Competición 2"
              value={competencia2}
              onChange={(e) => setCompetencia2(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Autocompletado para Competición 2 */}
            {competencia2 && (
              <ul className="absolute bg-white border border-gray-300 rounded-md w-full z-10">
                {filterOptions(competiciones, competencia2).map((comp) => (
                  <li key={comp} onClick={() => setCompetencia2(comp)} className="p-2 hover:bg-gray-200 cursor-pointer">
                    {comp}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Cuota"
            value={cuota}
            onChange={(e) => setCuota(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            inputMode="decimal"
          />
          <input
            type="text"
            placeholder="Stake"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            inputMode="decimal"
          />
        </div>

        <textarea
          placeholder="Análisis"
          value={analisis}
          onChange={(e) => setAnalisis(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
        />
        <input
          type="text"
          placeholder="Recomendación"
          value={recomendacion}
          onChange={(e) => setRecomendacion(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={generarMensaje}
          className="w-full py-3 mt-4 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Generar Mensaje
        </button>

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-4">
              <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path>
              </svg>
              <span className="text-gray-700">Generando mensaje...</span>
            </div>
          </div>
        )}

        {message && !loading && googleImageUrls.length > 0 && (
          <div className="w-full max-w-md p-4 mt-6 bg-green-50 border border-green-300 rounded-lg">
            <Image
              src={googleImageUrls[currentImageIndex]}
              alt="User"
              width={500}
              height={200}
              className="w-full h-full"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : googleImageUrls.length - 1))}
                className="w-1/2 p-2 bg-blue-300 text-white hover:bg-gray-200 transition rounded-none"
              >
                ⬅️
              </button>
              <button
                onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex < googleImageUrls.length - 1 ? prevIndex + 1 : 0))}
                className="w-1/2 p-2 bg-blue-300 text-white hover:bg-gray-200 transition rounded-none"
              >
                ➡️
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-2 text-green-700">Mensaje Generado:</h2>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none overflow-hidden"
              style={{ height: "auto" }} // Ensure initial height is set to auto
            />
            <button
              onClick={enviarATelegram}
              className="w-full py-3 mt-4 bg-green-600 text-white rounded-md text-lg font-medium hover:bg-green-700 transition-colors"
            >
              Enviar a Telegram
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
