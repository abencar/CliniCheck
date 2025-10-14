import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
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
    const { id } = params;
    
    const medicoRef = doc(db, 'medicos', id);
    
    const medicoDoc = await getDoc(medicoRef);
    if (!medicoDoc.exists()) {
      return NextResponse.json(
        { error: 'Médico no encontrado' },
        { status: 404 }
      );
    }
    
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
