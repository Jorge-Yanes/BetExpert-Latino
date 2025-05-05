"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import axios from "axios";
import Image from "next/image";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import dotenv from "dotenv";
import leagues from "../../data/leagues.json";
import leaguesIDName from "../../data/leaguesIDName.json";
import { setDoc, doc } from "firebase/firestore";
import Select from "react-select";

// Cargar las variables de entorno
dotenv.config();

const GOOGLE_API_KEY = "AIzaSyBqBYaTcKqtgCtYgTeRxZZZel30IoLxL1Q";
const GOOGLE_CX = "e3eff5474587546a7";

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

const API_FOOTBALL_URL = "https://v3.football.api-sports.io/fixtures";
const API_FOOTBALL_KEY = "5608c120367cf9967e9d177199cc2da7"; // Reemplaza con tu clave de API

// Create an instance of OpenAIApi
const openai = new OpenAI({
  apiKey:
    "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",
  dangerouslyAllowBrowser: true,
});

export default function NuevaApuesta() {
  const [loading, setLoading] = useState(false);
  //const [competencia, setCompetencia] = useState<string>("");
  //const [competencia2, setCompetencia2] = useState<string>("");
  const [cuota, setCuota] = useState<string>("");
  const [stake, setStake] = useState<string>("");
  const [importe, setImporte] = useState<string>("");
  const [analisis, setAnalisis] = useState<string>("");
  const [recomendacion, setRecomendacion] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [googleImageUrls, setGoogleImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [editedImageUrl, setEditedImageUrl] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDate2, setSelectedDate2] = useState(new Date());

  // Nuevos estados para el segundo partido
  const [showSecondMatch, setShowSecondMatch] = useState<boolean>(false); // Estado para controlar la visibilidad
  const [partidoAcabado, setPartidoAcabado] = useState<boolean>(false); // Estado para controlar la visibilidad
  const [mensajeResultadoEnviado, setMensajeResultadoEnviado] =
    useState<boolean>(false); // Estado para controlar la visibilidad

  const [partidos, setPartidos] = useState<any[]>([]);
  const [partidos1, setPartidos1] = useState<any[]>([]);
  const [selectedPartido1, setSelectedPartido1] = useState<any | null>(null);
  const [selectedCompetencia1, setSelectedCompetencia1] = useState<any | null>(
    null
  );
  const [equipoA, setEquipoA] = useState<string>("");
  const [equipoB, setEquipoB] = useState<string>("");

  const [partidos2, setPartidos2] = useState<any[]>([]);
  const [selectedPartido2, setSelectedPartido2] = useState<any | null>(null);
  const [selectedCompetencia2, setSelectedCompetencia2] = useState<any | null>(
    null
  );
  const [equipoC, setEquipoC] = useState<string>("");
  const [equipoD, setEquipoD] = useState<string>("");

  const fetchImageUrls = async () => {
    const storageRef = ref(getStorage(), "pronosticosGratuitosImages");
    const listResult = await listAll(storageRef);

    const urls = await Promise.all(
      listResult.items.map(async (item) => await getDownloadURL(item))
    );
    setImageUrls(urls);
    setImageUrl(getRandomImage(urls));
  };

  const getRandomImage = (urls: string[]) => {
    const randomIndex = Math.floor(Math.random() * urls.length);
    return urls[randomIndex];
  };

  useEffect(() => {
    fetchImageUrls();
  }, []);

  /**
   * Función para buscar imágenes en Google Images.
   * @param query - Nombre del equipo u otro término de búsqueda
   * @returns La URL de la primera imagen encontrada o un mensaje de error
   */
  async function buscarImagenEnGoogle(query: string): Promise<string[]> {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(
        query
      )}&searchType=image&num=3`;

      const response = await axios.get(url);
      const items = response.data.items;

      if (items && items.length > 0) {
        return items.map((item: any) => item.link);
      } else {
        console.error("No se encontraron imágenes.");
        return [];
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error al buscar la imagen:", error.message);
        console.error("Detalles del error:", error.response?.data);
      } else {
        console.error("Error inesperado:", error);
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
        - Competición: {selectedCompetencia1} y {selectedCompetencia2}
        - Cuota: {cuota}
        - Stake: {stake}
        - Resultado del análisis: {analisis}
        - Apuesta sugerida: {recomendacion}.


      # Ejemplo de salida 1:
      🌞 ¡Saludos equipo! Hoy salimos al campo llenos de energía y con determinación para romper la jornada. Nos enfrentamos a un emocionante partido entre {equipoA} y {equipoB}, y estamos listos para aprovechar nuestra predicción ganadora. 🏆
      🌞 ¡Saludos equipo! Hoy salimos al campo llenos de energía y con determinación para romper la jornada. Nos enfrentamos a un emocionante partido entre {equipoA} y {equipoB}, y {equipoC} y {equipoD}, y estamos listos para aprovechar nuestra predicción ganadora. 🏆

      🍀 Apuesta Gratuita 🍀  
      🏆 {selectedCompetencia1}  
      🏆 {selectedCompetencia1} y {selectedCompetencia2}  
      🇪🇸 {equipoA} vs {equipoB}  
      🇪🇸 {equipoC} vs {equipoD}  
      🔘 STAKE {stake} ⚡️Cuota {cuota}⚡️  
      💡 Recomendamos: {recomendacion}

      ¡Vamos con todo equipo, las ganancias nos esperan hoy! 🎯

      # Notas

      - Asegúrate de personalizar los mensajes de acuerdo con los detalles específicos de cada partido.
      - Usa un lenguaje coherente y enérgico para replicar fielmente el estilo marcado en los ejemplos.
    `;

    const userInput = `
      Partido: ${equipoA} vs ${equipoB} ${showSecondMatch ? `y ${equipoC} vs ${equipoD}` : ""}
      Competición: ${selectedCompetencia1} ${showSecondMatch ? `y ${selectedCompetencia2}` : ""}
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
      const query2 = `${selectedCompetencia1}`;
      const queries = [query1, query2]; // Inicializar con las consultas del primer partido

      if (showSecondMatch) {
        const query3 = `${equipoC} vs ${equipoD}`;
        const query4 = `${selectedCompetencia2}`;
        queries.push(query3, query4); // Agregar consultas del segundo partido
        queries.push(`jugadores de ${equipoC}`, `jugadores de ${equipoD}`); // Agregar jugadores del segundo partido
      }
      queries.push(`jugadores de ${equipoA}`, `jugadores de ${equipoB}`); // Agregar jugadores del primer partido

      try {
        const imagenesGoogleAPIUrls = await Promise.all(
          queries.map((query) => buscarImagenEnGoogle(query))
        );
        const flattenedImages = imagenesGoogleAPIUrls.flat(); // Aplanar el array de imágenes
        if (flattenedImages.length > 0) {
          setGoogleImageUrls(flattenedImages);
          setCurrentImageIndex(0);
          console.log(`Imágenes encontradas: ${flattenedImages}`);
        } else {
          console.log("No se encontraron imágenes.");
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

  // Function to save betting information to Firestore
  const guardarPronosticoBBDD = async () => {
    const currentDate = new Date();
    const docId = currentDate.toISOString(); // Use ISO string for unique ID
    const bettingData = {
      partidoAcabado,
      mensajeResultadoEnviado,
      equipoA,
      equipoB,
      selectedPartido1,
      equipoC: showSecondMatch ? equipoC : null,
      equipoD: showSecondMatch ? equipoD : null,
      selectedPartido2,
      selectedCompetencia1,
      selectedCompetencia2: showSecondMatch ? selectedCompetencia2 : null,
      stake,
      cuota,
      recomendacion,
      message,
      editedImageUrl,
      timestamp: currentDate,
    };

    try {
      await setDoc(doc(db, "pronosticosGratuitos", docId), bettingData);
    } catch (error) {
      console.error("Error saving betting information to Firestore:", error);
    }
  };

  // Get all available fixtures from one {date} and league
  const buscarPartidos = async (
    leagueId: string,
    setPartidos: React.Dispatch<React.SetStateAction<any[]>>,
    fecha: Date
  ) => {
    try {
      // Convert the timestamp to a date string in the format YYYY-MM-DD
      const formattedDate = new Date(fecha).toISOString().split("T")[0];

      console.log("ENTRA EN BUSCAR PARTIDOS", formattedDate.substring(0, 4));
      console.log("ENTRA EN BUSCAR PARTIDOS", leagueId);

      const response = await axios.get(API_FOOTBALL_URL, {
        headers: {
          "x-apisports-key": API_FOOTBALL_KEY,
        },
        params: {
          date: formattedDate,
          league: leagueId,
          season: formattedDate.substring(0, 4),
        },
      });
      setPartidos(response.data.response);
      console.log("ENTRA EN BUSCAR PARTIDOS", response.data.response);
    } catch (error) {
      console.error("Error al buscar partidos:", error);
    }
  };
  const competenciaOptions = Object.entries(leaguesIDName).map(
    ([key, value]) => ({
      value: key,
      label: value,
    })
  );

  const handleCompetenciaSelect1 = (selectedOption: any) => {
    setSelectedCompetencia1(selectedOption);
    if (selectedOption) {
      buscarPartidos(selectedOption.value, setPartidos1, selectedDate);
    }
  };

  const handleCompetenciaSelect2 = (selectedOption: any) => {
    setSelectedCompetencia2(selectedOption);
    if (selectedOption) {
      buscarPartidos(selectedOption.value, setPartidos2, selectedDate2);
    }
  };

  const partidoOptions1 = partidos1.map((partido) => ({
    value: partido.fixture.id,
    label: `${partido.teams.home.name} vs ${partido.teams.away.name}`,
    data: partido, // Store the entire partido object for easy access
  }));

  const partidoOptions2 = partidos2.map((partido) => ({
    value: partido.fixture.id,
    label: `${partido.teams.home.name} vs ${partido.teams.away.name}`,
    data: partido, // Store the entire partido object for easy access
  }));

  const handlePartidoSelect1 = (selectedOption: any) => {
    setSelectedPartido1(selectedOption);
    if (selectedOption) {
      const [team1, team2] = selectedOption.label.split(" vs ");
      setEquipoA(team1);
      setEquipoB(team2);
    }
  };

  const handlePartidoSelect2 = (selectedOption: any) => {
    setSelectedPartido2(selectedOption);
    if (selectedOption) {
      const [team1, team2] = selectedOption.label.split(" vs ");
      setEquipoC(team1);
      setEquipoD(team2);
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

      // lógica para enviar la imagen de la apuesta editada al canal de Telegram
      await axios.post(photoUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: editedImageUrl,
      });

      // Save the betting information to Firestore
      await guardarPronosticoBBDD();

      alert("Mensaje enviado correctamente al canal!");
      window.location.reload(); // Refresh the page
    } catch (error) {
      console.error("Error enviando mensaje a Telegram:", error);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [message]); // Ensure this effect runs whenever `message` changes

  let cifraGanancias = Number(importe) * Number(cuota.replace(/,/g, '.')); // Reemplaza con tu valor real

  const handleImageUploadAndEdit = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file); // Append the file to the FormData object
      formData.append("cifraVerde", importe + ",00€"); // Append your other parameters
      formData.append("cifraImp", importe + ",00€");
      formData.append("cifraGanancias", cifraGanancias.toString() + ",00€");
      setLoading(true);

      //const response = await fetch("http://localhost:8080/edit-image", {
      const response = await fetch("https://jimp-cloudrun-713344855947.us-central1.run.app/edit-image", {
        method: "POST",
        body: formData, // Use FormData as the body
      });

      if (response.ok) {
        const data = await response.json(); // Parse the JSON response
        const editedImageUrl = data.imageUrl; // Extract the URL
        setEditedImageUrl(editedImageUrl); // Update with the Firebase Storage URL
      } else {
        console.error("Error editing image");
      }
      setLoading(false);
    } else {
      alert("Please upload an image first.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-top min-h-screen p-2 bg-gray-100">
      <h1 className="text-xl font-bold mb-6 text-blue-600">
        Generador de Pronósticos Gratuitos
      </h1>
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

        {/* Competencia 1 and Partido 1 */}

        <Select
          options={competenciaOptions}
          onChange={handleCompetenciaSelect1}
          placeholder="Seleccionar Liga"
          className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          isClearable={true}
        />
        <div className="flex space-x-2">
          <div className="flex w-32">
            <input
              type="date"
              value={selectedDate.toISOString().split("T")[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
                console.log(newDate);
                if (selectedCompetencia1) {
                  buscarPartidos(
                    selectedCompetencia1.value,
                    setPartidos1,
                    newDate
                  );
                }
              }}
              className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
              disabled={!selectedCompetencia1} // Disable if no competencia is selected
            />
          </div>
          <Select
            options={partidoOptions1}
            onChange={handlePartidoSelect1}
            placeholder="Buscar y Seleccionar Partido"
            className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
            isDisabled={!selectedCompetencia1} // Disable if no competencia is selected
            isClearable={true}
          />
        </div>
        {/* Botón para mostrar los campos del segundo partido */}
        <button
          onClick={() => setShowSecondMatch(!showSecondMatch)}
          className={`w-full py-1 rounded-md transition-colors ${showSecondMatch ? "bg-red-300" : "bg-green-300"
            } text-white hover:bg-opacity-80`}
        >
          {showSecondMatch
            ? "Ocultar Segundo Partido"
            : "Añadir Segundo Partido"}
        </button>

        {/* Campos del segundo partido */}
        {showSecondMatch && (
          <>
            {/* Competencia 2 and Partido 2 */}
            <Select
              options={competenciaOptions}
              onChange={handleCompetenciaSelect2}
              placeholder="Seleccionar Liga 2"
              className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-8"
              isClearable={true}
            />

            <div className="flex space-x-2">
              <div className="flex w-32">
                <input
                  type="date"
                  value={selectedDate2.toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setSelectedDate2(newDate);
                    console.log(newDate);
                    if (selectedCompetencia2) {
                      buscarPartidos(
                        selectedCompetencia2.value,
                        setPartidos2,
                        newDate
                      );
                    }
                  }}
                  className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
                  disabled={!selectedCompetencia2} // Disable if no competencia is selected
                />
              </div>
              <Select
                options={partidoOptions2}
                onChange={handlePartidoSelect2}
                placeholder="Buscar y Seleccionar Partido 2"
                className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
                isDisabled={!selectedCompetencia2} // Disable if no competencia is selected
                isClearable={true}
              />
            </div>
          </>
        )}


        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Cuota (Usar . no ,)"
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
        <div className="flex space-x-4">
          <div className="flex-none w-32">
            <input
              type="text"
              placeholder="Imp. Apuesta"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              inputMode="decimal"
            />
          </div>
          {stake && importe && (
            <div className="flex-auto w-64">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUploadAndEdit} // Cambia a handleImageUploadAndEdit
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Display the edited image if available */}
        {editedImageUrl && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Imagen Editada</h2>
            <img src={editedImageUrl} alt="Edited" className="w-full h-auto" />
          </div>
        )}

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
              <svg
                className="animate-spin h-5 w-5 text-indigo-500"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                ></path>
              </svg>
              <span className="text-gray-700">Cargando...</span>
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
                onClick={() =>
                  setCurrentImageIndex((prevIndex) =>
                    prevIndex > 0 ? prevIndex - 1 : googleImageUrls.length - 1
                  )
                }
                className="w-1/2 p-2 bg-blue-300 text-white hover:bg-gray-200 transition rounded-none"
              >
                ⬅️
              </button>
              <button
                onClick={() =>
                  setCurrentImageIndex((prevIndex) =>
                    prevIndex < googleImageUrls.length - 1 ? prevIndex + 1 : 0
                  )
                }
                className="w-1/2 p-2 bg-blue-300 text-white hover:bg-gray-200 transition rounded-none"
              >
                ➡️
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-2 text-green-700">
              Mensaje Generado:
            </h2>
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
