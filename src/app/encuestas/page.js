'use client'
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';

const Encuestas = () => {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEncuesta, setEditingEncuesta] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    preguntas: [{ texto: '', tipo: '', opciones: [''] }]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEncuestas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/encuestas');
        if (!response.ok) throw new Error('Error al cargar encuestas');
        const data = await response.json();
        setEncuestas(data);
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEncuestas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarPregunta = () => {
    setFormData(prev => ({
      ...prev,
      preguntas: [...prev.preguntas, { texto: '', tipo: '', opciones: [''] }]
    }));
  };

  const actualizarPregunta = (index, campo, valor) => {
    setFormData(prev => {
      const nuevasPreguntas = prev.preguntas.map((pregunta, idx) => {
        if (idx === index) {
          return { ...pregunta, [campo]: valor };
        }
        return pregunta;
      });
      return { ...prev, preguntas: nuevasPreguntas };
    });
  };

  const eliminarPregunta = (index) => {
    if (formData.preguntas.length > 1) {
      setFormData(prev => ({
        ...prev,
        preguntas: prev.preguntas.filter((_, i) => i !== index)
      }));
    }
  };

  const agregarOpcion = (preguntaIndex) => {
    setFormData(prev => {
      const nuevasPreguntas = prev.preguntas.map((pregunta, idx) => {
        if (idx === preguntaIndex) {
          return {
            ...pregunta,
            opciones: [...(pregunta.opciones || []), '']
          };
        }
        return pregunta;
      });
      return { ...prev, preguntas: nuevasPreguntas };
    });
  };

  const actualizarOpcion = (preguntaIndex, opcionIndex, valor) => {
    setFormData(prev => {
      const nuevasPreguntas = prev.preguntas.map((pregunta, idx) => {
        if (idx === preguntaIndex) {
          return {
            ...pregunta,
            opciones: pregunta.opciones.map((opcion, opIdx) => 
              opIdx === opcionIndex ? valor : opcion
            )
          };
        }
        return pregunta;
      });
      return { ...prev, preguntas: nuevasPreguntas };
    });
  };

  const eliminarOpcion = (preguntaIndex, opcionIndex) => {
    setFormData(prev => {
      const nuevasPreguntas = prev.preguntas.map((pregunta, idx) => {
        if (idx === preguntaIndex && pregunta.opciones.length > 1) {
          return {
            ...pregunta,
            opciones: pregunta.opciones.filter((_, opIdx) => opIdx !== opcionIndex)
          };
        }
        return pregunta;
      });
      return { ...prev, preguntas: nuevasPreguntas };
    });
  };

  const handleEditClick = (encuesta) => {
    setEditingEncuesta(encuesta);
    setFormData({
      titulo: encuesta.nombre || '',
      descripcion: encuesta.descripcion || '',
      preguntas: encuesta.preguntas || [{ texto: '', tipo: '', opciones: [''] }]
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEncuesta(null);
    setFormData({
      titulo: '',
      descripcion: '',
      preguntas: [{ texto: '', tipo: '', opciones: [''] }]
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta encuesta?')) {
      return;
    }

    try {
      const response = await fetch(`/api/encuestas/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar encuesta');

      const encuestasResponse = await fetch('/api/encuestas');
      const encuestasData = await encuestasResponse.json();
      setEncuestas(encuestasData);

      alert('Encuesta eliminada exitosamente');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar encuesta: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingEncuesta) {
        const response = await fetch(`/api/encuestas/${editingEncuesta.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formData.titulo,
            descripcion: formData.descripcion,
            preguntas: formData.preguntas
          }),
        });

        if (!response.ok) throw new Error('Error al actualizar encuesta');
        alert('Encuesta actualizada exitosamente');
      } else {
        const response = await fetch('/api/encuestas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formData.titulo,
            descripcion: formData.descripcion,
            preguntas: formData.preguntas
          }),
        });

        if (!response.ok) throw new Error('Error al crear encuesta');
        alert('Encuesta creada exitosamente');
      }

      const encuestasResponse = await fetch('/api/encuestas');
      const encuestasData = await encuestasResponse.json();
      setEncuestas(encuestasData);

      handleCloseModal();
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />

        <main className="flex-1 p-8 ml-64">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Administracion de encuestas</h1>
            <p className="text-gray-600">Gestione las encuestas de seguimiento para cada fármaco</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#0D9498] hover:bg-[#0a7377] text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear encuesta
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading && (
            <div className="p-8 text-center text-gray-600">
              Cargando encuestas...
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center text-red-600">
              Error: {error}
            </div>
          )}
          
          {!loading && !error && encuestas.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              No hay encuestas registradas
            </div>
          )}
          
          <div className="space-y-3">
            {!loading && !error && encuestas.map((encuesta) => (
              <div 
                key={encuesta.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition bg-white border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0D9498] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 text-lg">{encuesta.nombre}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(encuesta)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Editar encuesta"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(encuesta.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar encuesta"
                  >
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingEncuesta ? 'Editar Encuesta' : 'Crear Nueva Encuesta'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Título */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] placeholder:text-gray-400 text-gray-900"
                    placeholder="Título de la encuesta"
                  />
                </div>

                {/* Descripción */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] placeholder:text-gray-400 text-gray-900"
                    placeholder="Descripción de la encuesta"
                  />
                </div>

                {/* Preguntas de la encuesta */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preguntas de la encuesta
                  </label>
                  
                  {formData.preguntas.map((pregunta, index) => (
                    <div key={index} className="mb-4 p-4 rounded-lg bg-gray-50 relative border border-gray-200">
                      {/* Botón eliminar pregunta */}
                      {formData.preguntas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarPregunta(index)}
                          className="absolute top-2 right-2 p-1.5 bg-white hover:bg-red-50 border border-gray-300 rounded-full transition shadow-sm z-10"
                          title="Eliminar pregunta"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      {/* Título de la pregunta */}
                      <div className="mb-3">
                        <input
                          type="text"
                          value={pregunta.texto}
                          onChange={(e) => actualizarPregunta(index, 'texto', e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] placeholder:text-gray-400 text-gray-900"
                          placeholder="Título de la pregunta"
                        />
                      </div>

                      {/* Tipo de respuesta */}
                      <div className="relative">
                        <label className="block text-xs text-gray-600 mb-1">Tipo de respuesta</label>
                        <select
                          value={pregunta.tipo}
                          onChange={(e) => actualizarPregunta(index, 'tipo', e.target.value)}
                          required
                          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white text-sm appearance-none"
                        >
                          <option value="numerica">Numérica (1-10)</option>
                          <option value="texto">Texto libre</option>
                          <option value="seleccion">Selección múltiple</option>
                          <option value="si-no">Sí/No</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 pt-6">
                          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Opciones de selección múltiple */}
                      {pregunta.tipo === 'seleccion' && (
                        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-300">
                          <label className="block text-xs text-gray-600 mb-2 font-medium">Opciones de respuesta</label>
                          {pregunta.opciones && pregunta.opciones.map((opcion, opcionIndex) => (
                            <div key={opcionIndex} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={opcion}
                                onChange={(e) => actualizarOpcion(index, opcionIndex, e.target.value)}
                                required
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] placeholder:text-gray-400 text-gray-900 text-sm"
                                placeholder={`Opción ${opcionIndex + 1}`}
                              />
                              {pregunta.opciones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarOpcion(index, opcionIndex)}
                                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => agregarOpcion(index)}
                            className="w-full py-2 mt-2 border border-dashed border-[#0D9498] text-[#0D9498] rounded-lg hover:bg-[#0D9498] hover:text-white transition text-sm"
                          >
                            + Agregar opción
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Botón agregar pregunta */}
                  <button
                    type="button"
                    onClick={agregarPregunta}
                    className="w-full py-2 border-2 border-dashed border-[#0D9498] text-[#0D9498] rounded-lg hover:bg-[#0D9498] hover:text-white transition font-medium"
                  >
                    + Agregar pregunta
                  </button>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#0D9498] hover:bg-[#0a7377] text-white rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting 
                      ? (editingEncuesta ? 'Actualizando...' : 'Creando...') 
                      : (editingEncuesta ? 'Actualizar' : 'Crear encuesta')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default Encuestas;
