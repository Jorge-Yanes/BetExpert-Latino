"use client";

import { useState } from "react";
import OpenAI from "openai";

// Create an instance of OpenAIApi
const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true 
});

export default function NuevaApuesta() {
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
      Genera un mensaje para un canal de Telegram para el análisis y pronóstico de un partido de fútbol replicando el estilo de los ejemplos proporcionados. Usa los datos específicos del partido que te serán indicados.

      # Detalles

      - Proporciona un inicio motivador y energizante que anime al receptor del mensaje.
      - Explica algunos detalles del contexto del partido, incluyendo estadísticas relevantes o eventos recientes relacionados con los equipos.
      - Concluye con una apuesta gratuita, mostrando los detalles de la competición, el stake, la cuota, y una recomendación específica.

      # Plantilla de Mensaje

      1. **Saludos Motivadores:**
         - Comienza con un saludo entusiasta para captar la atención del receptor del mensaje.

      2. **Análisis Contextual:**
         - Incluye estadísticas, noticias o consideraciones recientes sobre ambos equipos.
         - Usa un tono positivo y convencedor para motivar la confianza en la apuesta sugerida.

      3. **Apuesta Sugerida:**
         - Usa símbolos y emojis para hacer el mensaje más atractivo.
         - Incluye claramente todos los datos del partido en formato estructurado.

      # Ejemplo de salida:

      🌞 ¡Saludos equipo! Hoy salimos al campo llenos de energía y con determinación para romper la jornada. Nos enfrentamos a un emocionante partido entre {equipoA} y {equipoB}, y estamos listos para aprovechar nuestra predicción ganadora. 🏆

      🍀 Apuesta Gratuita 🍀  
      🇪🇸 {competencia}  
      🔘 STAKE {stake} ⚡️Cuota {cuota}⚡️  
      💡 Recomendamos: {recomendacion}

      ¡Vamos con todo equipo, las ganancias nos esperan hoy! 🎯
    `;

    const userInput = `
      Partido: ${equipoA} vs ${equipoB}
      Competición: ${competencia}
      Cuota: ${cuota}
      Stake: ${stake}
      Análisis: ${analisis}
      Recomendación: ${recomendacion}
    `;

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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-semibold">Generador de Mensajes de Apuestas</h1>
      <div className="flex flex-col space-y-4 mt-4">
        <input
          type="text"
          placeholder="Equipo A"
          value={equipoA}
          onChange={(e) => setEquipoA(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Equipo B"
          value={equipoB}
          onChange={(e) => setEquipoB(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Competencia"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Cuota"
          value={cuota}
          onChange={(e) => setCuota(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Stake"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="Análisis"
          value={analisis}
          onChange={(e) => setAnalisis(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Recomendación"
          value={recomendacion}
          onChange={(e) => setRecomendacion(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <button
          onClick={generarMensaje}
          className="mt-4 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Generar Mensaje
        </button>
      </div>
      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
}
