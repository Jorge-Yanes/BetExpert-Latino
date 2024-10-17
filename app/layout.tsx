import type { Metadata } from "next";
import localFont from "next/font/local";
import '../styles/global.css';
import Script from "next/script";
import Link from "next/link"; // Importa Link para la navegación

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BettingExperts Latino Telegram Mini App",
  description: "Esto es una aplicacion de Telegram para BettingExperts Latino",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="flex space-x-2 p-2 bg-gray-200">
          <Link href="/" className="p-2 border-b-2 border-transparent hover:border-blue-500 transition duration-200">Programar Mensajes Buenos Dias</Link>
          <Link href="/nuevaApuesta" className="p-2 border-b-2 border-transparent hover:border-blue-500 transition duration-200">Nuevo Pronostico Gratuito</Link> {/* Enlace a la segunda pestaña */}
        </nav>
        {children}
      </body>
    </html>
  );
}
