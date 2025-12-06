import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userUid, ...updates } = body;
    if (!userUid) {
      return NextResponse.json({ error: 'Falta userUid' }, { status: 400 });
    }
  
    const userRef = doc(db, 'usuarios', userUid);
    const userSnap = await getDoc(userRef);
    const rol = userSnap.exists() ? (userSnap.data().rol || 'medico') : 'medico';
    if (rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const pacienteRef = doc(db, 'pacientes', id);
    
    const pacienteDoc = await getDoc(pacienteRef);
    if (!pacienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }
    
    await updateDoc(pacienteRef, updates);
    
    return NextResponse.json(
      { message: 'Paciente actualizado exitosamente', id },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar paciente' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');
    if (!userUid) {
      return NextResponse.json({ error: 'Falta userUid' }, { status: 400 });
    }
    const userRef = doc(db, 'usuarios', userUid);
    const userSnap = await getDoc(userRef);
    const rol = userSnap.exists() ? (userSnap.data().rol || 'medico') : 'medico';
    if (rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    const pacienteRef = doc(db, 'pacientes', id);
    const pacienteDoc = await getDoc(pacienteRef);
    if (!pacienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }


    const pacienteData = pacienteDoc.data();
    if (pacienteData.uid) {
      try {
        const { adminAuth } = await import('@/lib/firebaseAdmin');
        await adminAuth.deleteUser(pacienteData.uid);
      } catch (authError) {

      }
    }

    await deleteDoc(pacienteRef);

    return NextResponse.json(
      { message: 'Paciente eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar paciente' },
      { status: 500 }
    );
  }
}
