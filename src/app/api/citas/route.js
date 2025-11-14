import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');

    // Si no hay userUid, devolver todas (compatibilidad, ProtectedRoute debería impedir esto)
    if (!userUid) {
      const citasRef = collection(db, 'citas');
      const snapshot = await getDocs(citasRef);
      const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return NextResponse.json(citas);
    }

    // Obtener rol del usuario
    const userRef = doc(db, 'usuarios', userUid);
    const userSnap = await getDoc(userRef);
    const rol = userSnap.exists() ? (userSnap.data().rol || 'medico') : 'medico';

    if (rol === 'admin') {
      const citasRef = collection(db, 'citas');
      const snapshot = await getDocs(citasRef);
      const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return NextResponse.json(citas);
    }

    // Rol médico: filtrar solo sus citas
    // 1) Resolver medicoId a partir del uid
    const medicosRef = collection(db, 'medicos');
    const medicosSnap = await getDocs(medicosRef);
    const medicoDoc = medicosSnap.docs.find(d => d.data().uid === userUid);
    if (!medicoDoc) {
      return NextResponse.json([]);
    }
    const medicoId = medicoDoc.id;

    const resultsMap = new Map();

    // 2) Citas con campo directo medicoId
    const citasRef = collection(db, 'citas');
    const qMedicoId = query(citasRef, where('medicoId', '==', medicoId));
    const snapMedicoId = await getDocs(qMedicoId);
    snapMedicoId.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));

    // 3) Citas con campo medicoUid/doctorUid
    const qMedicoUid = query(citasRef, where('medicoUid', '==', userUid));
    const snapMedicoUid = await getDocs(qMedicoUid);
    snapMedicoUid.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));

    const qDoctorUid = query(citasRef, where('doctorUid', '==', userUid));
    const snapDoctorUid = await getDocs(qDoctorUid);
    snapDoctorUid.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));

    const citas = Array.from(resultsMap.values());
    return NextResponse.json(citas);
  } catch (error) {
    console.error('Error fetching citas:', error);
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const citasRef = collection(db, 'citas');
    const docRef = await addDoc(citasRef, {
      ...body,
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { message: 'Cita creada exitosamente', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cita:', error);
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, userUid, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta id de la cita' }, { status: 400 });
    }

    // Autorización básica por rol
    if (!userUid) {
      return NextResponse.json({ error: 'Falta userUid para validar permisos' }, { status: 400 });
    }

    // Obtener rol del usuario
    const userDocRef = doc(db, 'usuarios', userUid);
    const userSnap = await getDoc(userDocRef);
    const rol = userSnap.exists() ? (userSnap.data().rol || 'medico') : 'medico';

    // Admin puede actualizar cualquier cita
    if (rol !== 'admin') {
      // Si es médico, validar que la cita es de un paciente suyo o asignada a él
      // 1) Resolver el documento del médico a partir del uid
      const medicosRef = collection(db, 'medicos');
      const medicosSnap = await getDocs(medicosRef);
      const medicoDoc = medicosSnap.docs.find(d => d.data().uid === userUid);
      if (!medicoDoc) {
        return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
      }
      const medicoId = medicoDoc.id;

      // 2) Leer la cita
      const citaRef = doc(db, 'citas', id);
      const citaSnap = await getDoc(citaRef);
      if (!citaSnap.exists()) {
        return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
      }
      const cita = { id: citaSnap.id, ...citaSnap.data() };

      // 3) Validar propiedad por diferentes formas
      let permitido = false;
      // a) Campo directo medicoId en la cita
      if (cita.medicoId && cita.medicoId === medicoId) permitido = true;
      // b) Campo doctorUid o medicoUid en la cita
      if (!permitido && (cita.doctorUid || cita.medicoUid)) {
        const uidCampo = cita.doctorUid || cita.medicoUid;
        if (uidCampo === userUid) permitido = true;
      }
      // c) A través del pacienteId -> pacientes.medicoId
      if (!permitido && cita.pacienteId) {
        const pacienteRef = doc(db, 'pacientes', cita.pacienteId);
        const pacienteSnap = await getDoc(pacienteRef);
        if (pacienteSnap.exists()) {
          const paciente = pacienteSnap.data();
          if (paciente.medicoId === medicoId) permitido = true;
        }
      }

      if (!permitido) {
        return NextResponse.json({ error: 'No tienes permisos para actualizar esta cita' }, { status: 403 });
      }

      // Si llega aquí, está permitido para el médico
    }

    const citaRef = doc(db, 'citas', id);
    await updateDoc(citaRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: 'Cita actualizada' }, { status: 200 });
  } catch (error) {
    console.error('Error updating cita:', error);
    return NextResponse.json({ error: 'Error al actualizar cita' }, { status: 500 });
  }
}
