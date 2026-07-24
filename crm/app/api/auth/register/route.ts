import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Numele, email-ul și parola sunt obligatorii' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Parola trebuie să aibă minim 6 caractere' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalid' }, { status: 400 });
    }

    const existing = getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'Există deja un cont cu acest email' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = createUser({
      name: String(name).trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role: null,
      status: 'pending',
    });

    return NextResponse.json({ user, message: 'Contul tău a fost creat și așteaptă aprobarea unui administrator.' }, { status: 201 });
  } catch (err) {
    console.error('[register] error:', err);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
