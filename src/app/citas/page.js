'use client'
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../../components/Sidebar';
import HamburgerMenu from '../../components/HamburgerMenu';
import ProtectedRoute, { useUser } from '../../components/ProtectedRoute';

const CitasContent = () => {
  const user = useUser();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [medicoIdActual, setMedicoIdActual] = useState(null);
  const isAdmin = (user?.rol === 'admin');

  const sortCitas = (arr) => {

    const order = { pendiente: 0, confirmado: 1, rechazado: 2 };
    return [...arr].sort((a, b) => {
      const ea = (a.estado || 'pendiente').toString();
      const eb = (b.estado || 'pendiente').toString();
      const pa = order[ea] !== undefined ? order[ea] : 3;
      const pb = order[eb] !== undefined ? order[eb] : 3;
      if (pa !== pb) return pa - pb;

      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  };


  useEffect(() => {
    const computePageSize = () => {
      try {
        const available = window.innerHeight - 220;
        const example = document.querySelector('.cita-card');
        const cardHeight = example ? Math.ceil(example.getBoundingClientRect().height + 16) : 140;
        const newSize = Math.max(1, Math.floor(available / cardHeight));
        setPageSize(prev => prev === newSize ? prev : newSize);
        setCurrentPage(1);
      } catch (e) {

      }
    };

    computePageSize();
    window.addEventListener('resize', computePageSize);
    return () => window.removeEventListener('resize', computePageSize);
  }, []);


  const handleUpdateEstado = async (id, nuevoEstado) => {
    console.debug('[citas] start handleUpdateEstado', { id, nuevoEstado });

    setProcessingIds(prev => prev.includes(id) ? prev : [...prev, id]);
  const previousCitas = citas;
  setCitas(prev => sortCitas(prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c)));
  setCurrentPage(1);

    try {
      const response = await fetch('/api/citas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado, userUid: user?.uid })
      });

      const data = await response.json().catch(() => ({}));
      console.debug('[citas] PATCH response', response.status, data);

      if (!response.ok) {
        throw new Error(data?.error || 'Error al actualizar cita');
      }


      await fetchCitas();
    } catch (err) {
      console.error('Error actualizando estado de cita:', err);
      toast.error('Error actualizando cita: ' + err.message);

      setCitas(previousCitas);
    } finally {
      setProcessingIds(prev => prev.filter(x => x !== id));
    }
  };

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const url = user?.uid ? `/api/citas?userUid=${user.uid}` : '/api/citas';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar citas');
  const data = await response.json();
  setCitas(sortCitas(data));
  setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError(err.message || String(err));
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const resolverMedicoId = async () => {
      if (user?.rol !== 'medico' || !user?.uid) return;
      try {
        const res = await fetch('/api/medicos');
        if (!res.ok) return;
        const medicos = await res.json();
        const me = medicos.find(m => m.uid === user.uid);
        if (me) setMedicoIdActual(me.id);
      } catch {}
    };
    resolverMedicoId();
  }, [user?.rol, user?.uid]);

  useEffect(() => {
    if (!user) return;
    fetchCitas();
  }, [user?.uid]);

  const puedeGestionar = (cita) => {
    if (isAdmin) return true;
    if (user?.rol !== 'medico' || !medicoIdActual) return false;
    if (cita.medicoId && cita.medicoId === medicoIdActual) return true;
    if (cita.pacienteMedicoId && cita.pacienteMedicoId === medicoIdActual) return true;
    if ((cita.medicoUid && cita.medicoUid === user.uid) || (cita.doctorUid && cita.doctorUid === user.uid)) return true;
    
    
    return false;
  };

  const esMia = (cita) => {
    if (isAdmin) return true;
    if (user?.rol !== 'medico' || !medicoIdActual) return false;
    if (cita.medicoId && cita.medicoId === medicoIdActual) return true;
    if ((cita.medicoUid && cita.medicoUid === user.uid) || (cita.doctorUid && cita.doctorUid === user.uid)) return true;
    
    return false;
  };

  const totalVisibles = Array.isArray(citas) ? citas.filter(esMia).length : 0;

  return (
    <>
      <div className="hidden sm:block">
        <Sidebar />
      </div>
      <div className="sm:hidden">
        <HamburgerMenu />
      </div>
      <main className="min-h-screen bg-gray-200 pt-20 sm:pt-8 px-4 sm:px-8 sm:ml-64 overflow-x-hidden isolate transform-gpu antialiased">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestión de citas</h1>
            <p className="text-gray-600">Administra las citas médicas</p>
          </div>
          

        </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
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
          {!loading && !error && (() => {
            const visibles = Array.isArray(citas) ? citas.filter(esMia) : [];
            const total = visibles.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const page = Math.min(Math.max(1, currentPage), totalPages);
            const start = (page - 1) * pageSize;
            const paginated = visibles.slice(start, start + pageSize);
            return paginated.map((cita) => (
            <div 
              key={cita.id}
              className="cita-card bg-white rounded-2xl p-6 hover:shadow-sm transition-shadow duration-200 min-h-[120px] sm:min-h-0 overflow-hidden relative border border-gray-200"
              style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Icono de calendario */}
                <div className="w-14 h-14 bg-[#0D9498] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Fecha / Hora */}
                <div className="flex-shrink-0 min-w-[120px]">
                  <div className="text-sm text-gray-500">Fecha</div>
                  <div className="text-2xl font-extrabold text-[#0B6E6F]">{cita.fecha || '-'}</div>
                  <div className="text-base text-gray-600">{cita.hora || '-'}</div>
                </div>

                {/* Badge de estado — más grande y centrado verticalmente */}
                <div className="ml-0 sm:ml-4 flex-shrink-0 self-start sm:self-center flex items-center">
                  {(() => {
                    const estado = (cita.estado || 'pendiente').toString();
                    const base = 'px-4 py-2 rounded-full text-base font-semibold shadow-md ring-1';
                    if (estado === 'confirmado') return <span className={`${base} bg-green-100 text-green-900 ring-green-200`}>Confirmado</span>;
                    if (estado === 'rechazado') return <span className={`${base} bg-red-100 text-red-900 ring-red-200`}>Rechazado</span>;
                    return <span className={`${base} bg-yellow-100 text-yellow-900 ring-yellow-200`}>Pendiente</span>;
                  })()}
                </div>

                {/* Información principal (Paciente / Médico) */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-w-0">
                  <div>
                    <div className="text-sm text-gray-500">Paciente</div>
                    <div className="text-lg font-medium text-gray-900 truncate min-w-0" title={cita.paciente}>{cita.paciente || '—'}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Doctor</div>
                    <div className="text-lg font-medium text-gray-700 truncate min-w-0" title={cita.doctor || cita.medico}>{cita.doctor || cita.medico || '—'}</div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="ml-0 sm:ml-4 flex flex-col sm:flex-row items-center gap-3">
                  {cita.estado !== 'confirmado' && cita.estado !== 'rechazado' && puedeGestionar(cita) && (
                    (() => {
                    const isProcessing = processingIds.includes(cita.id);
                      return (
                        <>
                          <button
                            onClick={() => handleUpdateEstado(cita.id, 'rechazado')}
                            disabled={isProcessing}
                            className={`px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-150 shadow-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isProcessing ? 'Procesando...' : 'Rechazar'}
                          </button>

                          <button
                            onClick={() => handleUpdateEstado(cita.id, 'confirmado')}
                            disabled={isProcessing}
                            className={`px-4 py-2 bg-[#0D9498] hover:bg-[#0a7579] text-white text-sm font-medium rounded-lg transition-all duration-150 shadow-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isProcessing ? 'Procesando...' : 'Confirmar'}
                          </button>
                        </>
                      )
                    })()
                  )}
                </div>
              </div>
            </div>
            ));
          })()}
        </div>

        {/* Paginación */}
        {!loading && !error && totalVisibles > pageSize && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <div className="text-sm font-semibold text-gray-700">
              {(() => {
                const total = totalVisibles;
                const start = total === 0 ? 0 : (Math.min(total, (currentPage - 1) * pageSize + 1));
                const end = Math.min(total, currentPage * pageSize);
                return `Mostrando ${start} - ${end} de ${total}`;
              })()}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-150 ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border-2 border-[#0D9498] text-[#0D9498] hover:bg-[#0D9498] hover:text-white'
                }`}
              >
                ← Anterior
              </button>

              {/* Page numbers */}
              {(() => {
                const totalPages = Math.max(1, Math.ceil(totalVisibles / pageSize));
                const pages = [];
                for (let i = 1; i <= totalPages; i++) pages.push(i);
                return (
                  <div className="hidden sm:flex items-center gap-2">
                    {pages.map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-10 h-10 rounded-lg font-bold shadow-md transition-all duration-150 ${
                          p === currentPage 
                            ? 'bg-[#0D9498] text-white ring-2 ring-[#0D9498] ring-offset-2' 
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-[#0D9498] hover:text-[#0D9498]'
                        }`}
                      >{p}</button>
                    ))}
                  </div>
                )
              })()}

              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalVisibles / pageSize)}
                className={`px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-150 ${
                  currentPage >= Math.ceil(totalVisibles / pageSize)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border-2 border-[#0D9498] text-[#0D9498] hover:bg-[#0D9498] hover:text-white'
                }`}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
};

export default function Citas() {
  return (
    <ProtectedRoute>
      <CitasContent />
    </ProtectedRoute>
  );
}
