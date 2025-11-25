'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from './ProtectedRoute';

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const userData = useUser();

  const menuItems = [
    { path: '/resumen', label: 'Resumen', roles: ['medico', 'admin'] },
    { path: '/pacientes', label: 'Pacientes', roles: ['medico', 'admin'] },
    { path: '/medicos', label: 'Médicos', roles: ['admin'] },
    { path: '/estadisticas', label: 'Estadísticas', roles: ['medico', 'admin'] },
    { path: '/citas', label: 'Citas', roles: ['medico', 'admin'] },
    { path: '/encuestas', label: 'Encuestas', roles: ['admin'] },
  ];

  const visibleMenuItems = menuItems.filter(
    item => userData && item.roles.includes(userData.rol)
  );

  return (
    <nav className="sm:hidden fixed top-0 left-0 w-full z-50 bg-[#0D9498] text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
          </svg>
          <span className="font-bold text-xl">Clinicheck</span>
        </div>

        {/* Botón hamburguesa / cerrar */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="focus:outline-none transition-transform duration-200"
        >
          {open ? (
            // Icono de cerrar ✕
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Icono ☰
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menú con animación */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4">
          {visibleMenuItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setOpen(false)}
              className="block py-2 px-2 rounded hover:bg-white/10 text-lg"
            >
              {item.label}
            </Link>
          ))}

          <button
            className="w-full mt-2 py-2 px-2 bg-white text-[#0D9498] rounded hover:bg-gray-100"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default HamburgerMenu;
