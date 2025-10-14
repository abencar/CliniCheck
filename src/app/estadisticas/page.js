'use client'
import React from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';

const Estadisticas = () => {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Estadísticas</h1>
            <p className="text-gray-600">Análisis y métricas de la clínica</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-[#0D9498]">
            <p className="text-gray-600 text-center py-12">
              Módulo de estadísticas en construcción
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Estadisticas;
