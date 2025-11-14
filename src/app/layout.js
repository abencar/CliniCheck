import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Clinicheck",
  description: "Sistema de gestión de pacientes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#F9FAFB',
              color: '#1F2937',
              border: '1px solid #E5E7EB',
              fontSize: '0.875rem',
              maxWidth: '420px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#0D9498',
                secondary: 'white',
              },
              style: {
                border: '1px solid #0D9498',
                background: '#ECFEFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
              style: {
                border: '1px solid #EF4444',
                background: '#FEF2F2',
              },
            }
          }}
        />
        {children}
      </body>
    </html>
  );
}
