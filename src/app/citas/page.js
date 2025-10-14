'use client'
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/citas');
        if (!response.ok) throw new Error('Error al cargar citas');
        const data = await response.json();
        setCitas(data);
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestión de citas</h1>
            <p className="text-gray-600">Administra las citas médicas</p>
          </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-[#0D9498]">
          {loading && (
            <div className="p-8 text-center text-gray-600">
              Cargando citas...
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center text-red-600">
              Error: {error}
            </div>
          )}
          
          {!loading && !error && citas.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              No hay citas registradas
            </div>
          )}
          
          <div className="space-y-3">
            {!loading && !error && citas.map((cita) => (
              <div 
                key={cita.id}
                className="flex items-center gap-4 p-3 border-2 border-[#0D9498] rounded-lg hover:bg-gray-50 transition bg-white"
              >
                {/* Icono de calendario */}
                <div className="w-10 h-10 bg-[#0D9498] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Fecha y hora */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">{cita.fecha}</span>
                </div>

                {/* Doctor */}
                <div className="min-w-[100px]">
                  <span className="text-sm text-gray-700">{cita.doctor}</span>
                </div>

                {/* Médico */}
                <div className="min-w-[120px]">
                  <span className="text-sm text-gray-700">{cita.medico}</span>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 ml-auto">
                  {/* Botón Realizada */}
                  <button className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition">
                    Realizada
                  </button>
                  
                  {/* Botón Completar */}
                  <button className="px-4 py-1.5 bg-[#0D9498] hover:bg-[#0a7377] text-white text-sm font-medium rounded-md transition">
                    Completar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default Citas;
