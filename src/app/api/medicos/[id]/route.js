import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { adminAuth } from '@/lib/firebaseAdmin';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const medicoRef = doc(db, 'medicos', id);
    
    const medicoDoc = await getDoc(medicoRef);
    if (!medicoDoc.exists()) {
      return NextResponse.json(
        { error: 'Médico no encontrado' },
        { status: 404 }
      );
    }
    
    await updateDoc(medicoRef, body);
    
    return NextResponse.json(
      { message: 'Médico actualizado exitosamente', id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating medico:', error);
    return NextResponse.json(
      { error: 'Error al actualizar médico' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const medicoRef = doc(db, 'medicos', id);
    
    const medicoDoc = await getDoc(medicoRef);
    if (!medicoDoc.exists()) {
      return NextResponse.json(
        { error: 'Médico no encontrado' },
        { status: 404 }
      );
    }

    // Obtener el uid del médico
    const medicoData = medicoDoc.data();
    const uid = medicoData.uid;

    try {
      // Eliminar el usuario de Firebase Auth usando Admin SDK
      await adminAuth.deleteUser(uid);
    } catch (authError) {
      console.error('Error deleting user from Auth:', authError);
      return NextResponse.json(
        { error: 'Error al eliminar el usuario de autenticación' },
        { status: 500 }
      );
    }
    
    // Eliminar el documento de Firestore
    await deleteDoc(medicoRef);
    
    return NextResponse.json(
      { message: 'Médico eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting medico:', error);
    return NextResponse.json(
      { error: 'Error al eliminar médico' },
      { status: 500 }
    );
  }
}
