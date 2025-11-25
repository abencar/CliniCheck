'use client'
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import HamburgerMenu from '../../components/HamburgerMenu';
import ProtectedRoute, { useUser } from '../../components/ProtectedRoute';

const ResumenContent = () => {
  const user = useUser();
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const userUidParam = user?.uid ? `?userUid=${user.uid}` : '';

        const [pacientesRes, medicosRes, encuestasRes, citasRes, respuestasRes] = await Promise.all([
          fetch(`/api/pacientes${userUidParam}`),
          fetch('/api/medicos'),
          fetch('/api/encuestas'),
          fetch(`/api/citas${userUidParam}`),
          fetch('/api/respuestas')
        ]);

        setPacientes(pacientesRes.ok ? await pacientesRes.json() : []);
        setMedicos(medicosRes.ok ? await medicosRes.json() : []);
        setEncuestas(encuestasRes.ok ? await encuestasRes.json() : []);
        setCitas(citasRes.ok ? await citasRes.json() : []);
        setRespuestas(respuestasRes.ok ? await respuestasRes.json() : []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user?.uid]);

  const citasPendientes = citas.filter(cita => (cita.estado || '').toLowerCase() === 'pendiente').length;

  const pacienteUidsSet = new Set(pacientes.map(p => p.uid));
  const respuestasFiltradas = respuestas.filter(r => pacienteUidsSet.has(r.pacienteId));
  const ultimasRespuestas = respuestasFiltradas.slice(0, 4);


  const encuestasDeMisPacientes = new Set(pacientes.map(p => p.encuestaId).filter(Boolean));
  const esMedico = user?.rol === 'medico';

  return (
    <>
      <div className="hidden sm:block">
        <Sidebar />
      </div>
      <div className="sm:hidden">
        <HamburgerMenu />
      </div>
      <main className="min-h-screen bg-gray-200 p-8 sm:ml-64 pt-20 sm:pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {esMedico ? 'Resumen del médico' : 'Panel de administración'}
          </h1>
          <p className="text-gray-600 text-lg">
            {esMedico ? 'Métricas relacionadas con tus pacientes y citas' : 'Visión general del sistema'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <ResumenCard color="blue" label={esMedico ? 'Tus pacientes' : 'Total de pacientes'} value={loading ? '...' : pacientes.length} />
          <ResumenCard color="green" label="Total de médicos" value={loading ? '...' : medicos.length} />
          <ResumenCard color="pink" label={esMedico ? 'Encuestas de tus pacientes' : 'Encuestas creadas'} value={loading ? '...' : (esMedico ? encuestasDeMisPacientes.size : encuestas.length)} />
          <ResumenCard color="yellow" label="Citas pendientes" value={loading ? '...' : citasPendientes} />
        </div>


        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Últimas encuestas respondidas</h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9498]"></div>
            </div>
          ) : ultimasRespuestas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No hay encuestas respondidas</p>
              <p className="text-sm text-gray-400 mt-2">Las respuestas de los pacientes aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ultimasRespuestas.map((respuesta) => {
                const paciente = pacientes.find(p => p.uid === respuesta.pacienteId);
                const fecha = respuesta.createdAt
                  ? new Date(respuesta.createdAt).toLocaleDateString('es-ES')
                  : 'Fecha no disponible';
                return (
                  <div
                    key={respuesta.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0D9498] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900 text-lg">
                        {paciente ? paciente.nombre : 'Paciente desconocido'}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">Último cuestionario {fecha}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const ResumenCard = ({ color, label, value }) => {
  const colorClass = {
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    pink: 'bg-pink-400',
    yellow: 'bg-yellow-400',
  }[color];

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${colorClass} rounded-full flex items-center justify-center`}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default function Resumen() {
  return (
    <ProtectedRoute>
      <ResumenContent />
    </ProtectedRoute>
  );
}
