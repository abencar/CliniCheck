'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './ProtectedRoute';

export default function RoleProtection({ children, allowedRoles = [] }) {
  const router = useRouter();
  const userData = useUser();

  useEffect(() => {
    if (userData && !allowedRoles.includes(userData.rol)) {
      router.push('/resumen');
    }
  }, [userData, allowedRoles, router]);

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9498] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }
  
  if (!allowedRoles.includes(userData.rol)) {
    return null;
  }

  return children;
}
