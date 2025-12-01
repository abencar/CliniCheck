import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';

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
    // --- NUEVO: buscar la última respuesta de este paciente ---
    const respuestasRef = collection(db, 'respuestas');
    const rQuery = query(
      respuestasRef,
      where('pacienteId', '==', userUid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const rSnap = await getDocs(rQuery);

    let ultimaEncuesta = null;
    if (!rSnap.empty) {
      const rDoc = rSnap.docs[0];
      const rData = rDoc.data();
      const fecha = rData.createdAt && typeof rData.createdAt.toDate === 'function'
        ? rData.createdAt.toDate().toISOString()
        : rData.createdAt || null;

      // opcional: traer metadata de la encuesta respondida
      let encuestaMeta = null;
      if (rData.encuestaId) {
        const encuestaRef = doc(db, 'encuestas', rData.encuestaId);
        const encuestaDoc = await getDoc(encuestaRef);
        if (encuestaDoc.exists()) {
          encuestaMeta = { id: encuestaDoc.id, ...encuestaDoc.data() };
        }
      }

      ultimaEncuesta = {
        respuestaId: rDoc.id,
        encuestaId: rData.encuestaId || null,
        fecha,
        encuestaMeta
      };
    }

    return NextResponse.json({ ...pacienteData, medicoNombre, ultimaEncuesta }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener datos del paciente:', error);
    return NextResponse.json({ error: 'Error al obtener datos del paciente' }, { status: 500 });
  }
}
