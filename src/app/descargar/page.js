'use client'
import React, { useEffect, useRef } from 'react';

const DescargarApp = () => {
  const heartRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const el = heartRef.current;
    if (el) el.classList.add('heart-pulse');

    return () => {
      if (el) el.classList.remove('heart-pulse');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D9498] flex flex-col items-center justify-center px-4">
      <h1 className="text-white text-5xl md:text-6xl font-bold mb-2 drop-shadow-lg text-center">
        CliniCheck
      </h1>
      
      <p className="text-white/90 text-lg md:text-xl mb-8 drop-shadow-lg text-center">
        App de seguimiento para pacientes
      </p>

      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="bg-[#0D9498]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-[#0D9498]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h2 className="text-gray-800 text-xl font-semibold mb-2">
            Descarga la aplicación
          </h2>
          <p className="text-gray-600 text-sm">
            Disponible para dispositivos Android
          </p>
        </div>

        <a
          href="/apk/clinicheck.apk"
          download="CliniCheck.apk"
          className="w-full bg-[#22A1A7] hover:bg-[#1a8087] text-white font-medium py-4 rounded-md transition duration-200 shadow-md flex items-center justify-center gap-3"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
          Descargar APK
        </a>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-gray-800 font-medium mb-3">
            Instrucciones de instalación:
          </h3>
          <ol className="text-gray-600 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-[#0D9498] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
              <span>Descarga el archivo APK pulsando el botón</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#0D9498] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
              <span>Abre el archivo descargado en tu dispositivo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#0D9498] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
              <span>Si es la primera vez, permite la instalación desde "Orígenes desconocidos" en los ajustes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#0D9498] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
              <span>Pulsa "Instalar" y espera a que termine</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#0D9498] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">5</span>
              <span>¡Abre la app e inicia sesión con tus credenciales!</span>
            </li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <svg 
              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-amber-800 text-sm">
              <strong>Nota:</strong> Si tu teléfono bloquea la instalación, ve a Ajustes → Seguridad → Permitir orígenes desconocidos.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <svg 
          ref={heartRef}
          className="w-16 h-16 text-white drop-shadow-lg transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4" 
          />
        </svg>
      </div>

      <p className="text-white/70 text-sm mt-4">
        ¿Eres médico? <a href="/" className="underline hover:text-white">Accede aquí</a>
      </p>
    </div>
  );
};

export default DescargarApp;
