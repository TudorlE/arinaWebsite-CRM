import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, age, course, message } = await request.json();

    if (!name?.trim() || !phone?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Câmpurile obligatorii lipsesc' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert({ name, phone, email, age: age || null, course: course || null, message: message || null, status: 'nou' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ registration: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}
