'use client'
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useUser } from '../../components/ProtectedRoute';

const PacientesContent = () => {
  const userData = useUser();
  const [userReady, setUserReady] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    genero: '',
    ubicacion: '',
    telefono: '',
    email: '',
    encuestaId: '',
    medicoId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroMedico, setFiltroMedico] = useState('');

  // Detectar cuando userData está listo
  useEffect(() => {
    if (userData && userData.uid) {
      setUserReady(true);
    }
  }, [userData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userReady || !userData || !userData.uid) {
        setLoading(true);
        return;
      }
      
      try {
        setLoading(true);
        const userUidParam = `?userUid=${userData.uid}`;
        const url = `/api/pacientes${userUidParam}`;
        
        const [pacientesRes, medicosRes, encuestasRes, respuestasRes] = await Promise.all([
          fetch(url),
          fetch('/api/medicos'),
          fetch('/api/encuestas'),
          fetch('/api/respuestas')
        ]);
        
        if (!pacientesRes.ok) {
          throw new Error('Error al cargar pacientes');
        }
        
        const pacientesData = await pacientesRes.json();
        setPacientes(pacientesData);
        
        if (medicosRes.ok) {
          const medicosData = await medicosRes.json();
          setMedicos(medicosData);
        }
        if (encuestasRes.ok) {
          const encuestasData = await encuestasRes.json();
          setEncuestas(encuestasData);
        }
        if (respuestasRes.ok) {
          const respuestasData = await respuestasRes.json();
          setRespuestas(respuestasData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userReady]);

  // Si el rol es médico, limpiar el filtro por médico y mantenerlo oculto
  useEffect(() => {
    if (userData?.rol === 'medico' && filtroMedico !== '') {
      setFiltroMedico('');
    }
  }, [userData?.rol]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      edad: '',
      genero: '',
      ubicacion: '',
      telefono: '',
      email: '',
      encuestaId: '',
      medicoId: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        nombre: formData.nombre.trim(),
        ubicacion: formData.ubicacion.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim()
      };

      if (!payload.telefono) {
        delete payload.telefono;
      }

      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear paciente');
      }
      
      const userUidParam = userData?.uid ? `?userUid=${userData.uid}` : '';
      const pacientesResponse = await fetch(`/api/pacientes${userUidParam}`);
      setPacientes(await pacientesResponse.json());
      
      handleCloseModal();
      const correoNotificado = result?.email ? ` a ${result.email}` : '';
      toast.success(`Paciente creado y notificado${correoNotificado}`);
    } catch (err) {
      toast.error('Error al crear paciente: ' + (err.message || 'Intenta nuevamente'));
    } finally {
      setSubmitting(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEdad('');
    setFiltroGenero('');
    setFiltroUbicacion('');
    setFiltroMedico('');
  };

  const ubicacionesUnicas = [...new Set(pacientes.map(p => p.ubicacion))].filter(Boolean).sort();

  const pacientesFiltrados = pacientes.filter(paciente => {
    const emailPaciente = (paciente.email || paciente.nombre.toLowerCase().replace(/\s+/g, '.') + '@gmail.com').toLowerCase();
    const coincideBusqueda = busqueda === '' ||
      paciente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      emailPaciente.includes(busqueda.toLowerCase());
    let coincideEdad = true;
    if (filtroEdad === '0-18') coincideEdad = paciente.edad <= 18;
    else if (filtroEdad === '19-40') coincideEdad = paciente.edad >= 19 && paciente.edad <= 40;
    else if (filtroEdad === '41-65') coincideEdad = paciente.edad >= 41 && paciente.edad <= 65;
    else if (filtroEdad === '65+') coincideEdad = paciente.edad > 65;
    const coincideGenero = filtroGenero === '' || paciente.genero === filtroGenero;
    const coincideUbicacion = filtroUbicacion === '' || paciente.ubicacion === filtroUbicacion;
    const coincideMedico = filtroMedico === '' || paciente.medicoId === filtroMedico;
    return coincideBusqueda && coincideEdad && coincideGenero && coincideUbicacion && coincideMedico;
  });

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-gray-200 p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gestión de pacientes</h1>
              <p className="text-gray-600">
                {userData?.rol === 'medico' 
                  ? 'Supervisa a tus pacientes asignados' 
                  : 'Administra y supervisa a todos los pacientes'}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#0D9498] hover:bg-[#0a7377] text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Paciente
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0D9498] to-[#0a7579] rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Filtros Demográficos</h3>
              </div>
              <button onClick={limpiarFiltros} className="flex items-center gap-2 px-4 py-2 text-[#0D9498] bg-[#0D9498]/5 rounded-lg hover:bg-[#0D9498] hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Limpiar filtros
              </button>
            </div>

            {/* Buscador */}
            <div className="mb-4">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o email"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Rango de edad</label>
                <select 
                  value={filtroEdad}
                  onChange={(e) => setFiltroEdad(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white"
                >
                  <option value="">Todas las edades</option>
                  <option value="0-18">0-18</option>
                  <option value="19-40">19-40</option>
                  <option value="41-65">41-65</option>
                  <option value="65+">65+</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Género</label>
                <select 
                  value={filtroGenero}
                  onChange={(e) => setFiltroGenero(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white"
                >
                  <option value="">Todos los géneros</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Ubicación</label>
                <select 
                  value={filtroUbicacion}
                  onChange={(e) => setFiltroUbicacion(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white"
                >
                  <option value="">Todas las ubicaciones</option>
                  {ubicacionesUnicas.map((ubicacion) => (
                    <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                  ))}
                </select>
              </div>

              {userData?.rol === 'admin' && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Médico asignado</label>
                  <select 
                    value={filtroMedico}
                    onChange={(e) => setFiltroMedico(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white"
                  >
                    <option value="">Todos los médicos</option>
                    {medicos.map((medico) => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nombre} {medico.especialidad && `- ${medico.especialidad}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">Mostrando {pacientesFiltrados.length} de {pacientes.length} pacientes</p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="bg-white rounded-lg p-8 text-center text-gray-600 shadow-sm">
              Cargando pacientes...
            </div>
          )}
          {error && (
            <div className="bg-white rounded-lg p-8 text-center text-red-600 shadow-sm">
              Error: {error}
            </div>
          )}
          {!loading && !error && pacientes.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center text-gray-600 shadow-sm">
              No hay pacientes registrados
            </div>
          )}
          {!loading && !error && pacientesFiltrados.map((paciente) => {
            const medico = medicos.find(m => m.id === paciente.medicoId);
            const encuesta = encuestas.find(e => e.id === paciente.encuestaId);
            const emailVisible = paciente.email || `${paciente.nombre.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
            return (
              <div 
                key={paciente.id}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-[#0D9498] flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{paciente.nombre}</p>
                        <p className="text-sm text-gray-500 truncate">{emailVisible}</p>
                        <p className="text-sm text-gray-500 truncate">{paciente.ubicacion}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Edad</p>
                        <p className="text-gray-800">{paciente.edad}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Género</p>
                        <p className="text-gray-800 truncate">{paciente.genero}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Médico</p>
                        <p className="text-gray-800 truncate">{medico ? medico.nombre : 'Sin asignar'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Cuestionarios</p>
                        <p className="text-gray-800">{respuestas.filter(r => r.pacienteId === paciente.uid || r.pacienteId === paciente.id).length}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.href = `/pacientes/${paciente.id}`}
                    className="px-4 py-2 text-[#0D9498] hover:bg-[#0D9498] hover:text-white border border-[#0D9498] rounded-lg transition font-medium"
                  >
                    Ver paciente
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Paciente</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      placeholder="Nombre del paciente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad *
                    </label>
                    <input
                      type="number"
                      name="edad"
                      value={formData.edad}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="120"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      placeholder="Edad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género *
                    </label>
                    <select
                      name="genero"
                      value={formData.genero}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                    >
                      <option value="">Seleccionar género</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      placeholder="Ciudad o zona"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico personal *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      placeholder="Número de teléfono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encuesta Asignada *
                    </label>
                    <select
                      name="encuestaId"
                      value={formData.encuestaId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                    >
                      <option value="">Seleccionar encuesta</option>
                      {encuestas.map(encuesta => {
                        const tituloVisible = encuesta.nombre || encuesta.titulo || 'Encuesta sin título';
                        return (
                          <option key={encuesta.id} value={encuesta.id}>{tituloVisible}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Médico Asignado *
                    </label>
                    <select
                      name="medicoId"
                      value={formData.medicoId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                    >
                      <option value="">Seleccionar médico</option>
                      {medicos.map(medico => (
                        <option key={medico.id} value={medico.id}>
                          {medico.nombre} {medico.especialidad && `- ${medico.especialidad}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-4 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#0D9498] text-white rounded-lg hover:bg-[#0a7377] transition disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : 'Guardar Paciente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

// Wrapper que coloca el Provider por encima del contenido
export default function Pacientes() {
  return (
    <ProtectedRoute>
      <PacientesContent />
    </ProtectedRoute>
  );
}
