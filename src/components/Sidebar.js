'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useUser } from './ProtectedRoute';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const userData = useUser();
  const normalize = (p) => (p && p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p || '/');
  const isActive = (path) => {
    const cur = normalize(pathname);
    const base = normalize(path);
    return cur === base;
  };
  const isSubActive = (path) => {
    const cur = normalize(pathname);
    const base = normalize(path);
    return base !== '/' && cur.startsWith(base + '/');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    }
  };

  const medicoPagesAllowed = ['/resumen', '/pacientes', '/citas', '/encuestas', '/estadisticas'];
  
  const menuItems = [
    {
      path: '/resumen',
      label: 'Resumen',
      roles: ['medico', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/pacientes',
      label: 'Pacientes',
      roles: ['medico', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      path: '/medicos',
      label: 'Médicos',
      roles: ['admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/estadisticas',
      label: 'Estadísticas',
      roles: ['medico', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      path: '/citas',
      label: 'Citas',
      roles: ['medico', 'admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/encuestas',
      label: 'Encuestas',
      roles: ['admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const visibleMenuItems = menuItems.filter(item => 
    userData && item.roles.includes(userData.rol)
  );

  return (
    <aside className="w-64 bg-[#0D9498] text-white flex flex-col h-screen fixed top-0">
      <div className="p-4 text-center">
        <div className="flex justify-center mb-2">
          <svg 
            className="w-14 h-14 text-white" 
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
        <h2 className="text-xl font-bold">Clinicheck</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-visible">
        {visibleMenuItems.map((item) => {
          const active = isActive(item.path);
          const semi = !active && isSubActive(item.path);
          const baseClasses = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition';
          const stateClasses = active
            ? 'bg-white text-[#0D9498] shadow-md'
            : semi
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10';
          return (
            <Link 
              key={item.path}
              href={item.path}
              className={`${baseClasses} ${stateClasses}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 bg-white text-[#0D9498] rounded-lg text-sm font-medium hover:bg-gray-100 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
