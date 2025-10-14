import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const pacienteRef = doc(db, 'pacientes', id);
    
    const pacienteDoc = await getDoc(pacienteRef);
    if (!pacienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }
    
    await updateDoc(pacienteRef, body);
    
    return NextResponse.json(
      { message: 'Paciente actualizado exitosamente', id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating paciente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar paciente' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const pacienteRef = doc(db, 'pacientes', id);
    
    const pacienteDoc = await getDoc(pacienteRef);
    if (!pacienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }
    
    await deleteDoc(pacienteRef);
    
    return NextResponse.json(
      { message: 'Paciente eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting paciente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar paciente' },
      { status: 500 }
    );
  }
}
