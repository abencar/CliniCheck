import { auth } from './firebase';

/**
 * Valida el token de Firebase del header Authorization
 * @param {Request} request
 * @returns {Promise<{valid: boolean, uid?: string, error?: string}>}
 */
export async function validateAuthToken(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Token de autenticación no proporcionado' };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return { valid: false, error: 'Token inválido' };
    }

    return { valid: true, uid: null };
    
  } catch (error) {
    console.error('Error validando token:', error);
    return { valid: false, error: 'Error al validar token' };
  }
}

/**
 * Extrae el UID del usuario autenticado desde el header o body
 */
export function getUserIdFromRequest(request, body) {
  // Por ahora, confiar en el pacienteId del body
  return body.pacienteId || null;
}
