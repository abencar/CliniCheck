import { auth } from './firebase';


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

export function getUserIdFromRequest(request, body) {
  return body.pacienteId || null;
}
