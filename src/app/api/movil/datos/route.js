import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// GET /api/movil/datos?userUid=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');
    if (!userUid) {
      return NextResponse.json({ error: 'Falta userUid' }, { status: 400 });
    }
    // Buscar por campo uid en la colección pacientes
    const pacientesRef = collection(db, 'pacientes');
    const q = query(pacientesRef, where('uid', '==', userUid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }
    const pacienteData = snapshot.docs[0].data();
    let medicoNombre = null;
    if (pacienteData.medicoId) {
      // Buscar el nombre del médico en la colección medicos
      const medicosRef = collection(db, 'medicos');
      const medicoDoc = await getDocs(query(medicosRef, where('__name__', '==', pacienteData.medicoId)));
      if (!medicoDoc.empty) {
        const medicoData = medicoDoc.docs[0].data();
        medicoNombre = medicoData.nombre || null;
      }
    }
    return NextResponse.json({ ...pacienteData, medicoNombre }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener datos del paciente:', error);
    return NextResponse.json({ error: 'Error al obtener datos del paciente' }, { status: 500 });
  }
}
