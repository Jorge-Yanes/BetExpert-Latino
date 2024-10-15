"use client";

import { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import axios from 'axios';

const TELEGRAM_BOT_TOKEN = "8106664155:AAEbLO9kcy0ehQyxvztLtw8vIntwSszkkjY"; // Reemplaza esto con tu token de bot de Telegram
const TELEGRAM_CHAT_ID = "-1002356737756"; // Reemplaza esto con el chat ID donde quieres enviar el mensaje

// Create an instance of OpenAIApi
const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

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
        - Partido: {equipoA} vs {equipoB}
        - Competición: {competencia}
        - Cuota: {cuota}
        - Stake: {stake}
        - Resultado del análisis: {analisis}
        - Apuesta sugerida: {recomendacion}.


      # Ejemplo de salida 1:

      🌞 ¡Saludos equipo! Hoy salimos al campo llenos de energía y con determinación para romper la jornada. Nos enfrentamos a un emocionante partido entre {equipoA} y {equipoB}, y estamos listos para aprovechar nuestra predicción ganadora. 🏆

      🍀 Apuesta Gratuita 🍀  
      🇪🇸 {competencia}  
      🔘 STAKE {stake} ⚡️Cuota {cuota}⚡️  
      💡 Recomendamos: {recomendacion}

      ¡Vamos con todo equipo, las ganancias nos esperan hoy! 🎯

      # Notas

      - Asegúrate de personalizar los mensajes de acuerdo con los detalles específicos de cada partido.
      - Usa un lenguaje coherente y enérgico para replicar fielmente el estilo marcado en los ejemplos.
    `;

    const userInput = `
      Partido: ${equipoA} vs ${equipoB}
      Competición: ${competencia}
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
    } catch (error) {
      console.error("Error generating message:", error);
    } finally {
      setLoading(false);
    }
  };

  const enviarATelegram = async () => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    if (message) {

      try {
        // Aquí deberías implementar la lógica para enviar el mensaje al canal de Telegram
        // Esto podría implicar una llamada a una API de tu backend que maneje el envío
        await axios.post(url, {
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        });

        //Envio de una imagen a telegram
        /*const photoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        await axios.post(photoUrl, {
          chat_id: TELEGRAM_CHAT_ID,
          photo: data.imageUrl,
        });*/

        console.log("Mensaje enviado a Telegram:", message);
        alert("Mensaje enviado correctamente al canal!"); // Pop-up de confirmación

      } catch (error) {
        console.error("Error enviando mensaje a Telegram:", error);
      }
    } else {
      console.log("ERROR AL ENVIAR: MESAJE VACIO")
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-top min-h-screen p-2 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Generador de Mensajes de Apuestas</h1>

      <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md space-y-4">
        <input
          type="text"
          placeholder="Equipo A"
          value={equipoA}
          onChange={(e) => setEquipoA(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Equipo B"
          value={equipoB}
          onChange={(e) => setEquipoB(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Competicion"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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

        {message && !loading && (
          <div className="w-full max-w-md p-4 mt-6 bg-green-50 border border-green-300 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-green-700">Mensaje Generado:</h2>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none overflow-hidden"
              style={{ height: "auto" }}
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
