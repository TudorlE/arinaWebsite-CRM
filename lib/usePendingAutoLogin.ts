'use client';

import { useEffect, useRef } from 'react';

/**
 * While `active`, silently retries /api/auth/login every `intervalMs` with
 * the given credentials — so someone sitting on a "cont în așteptare" screen
 * gets in automatically the instant an admin approves them, instead of
 * having to notice and manually resubmit the form.
 */
export function usePendingAutoLogin(
  active: boolean,
  email: string,
  password: string,
  onResult: (ok: boolean, data: { status?: string }) => void,
  intervalMs = 2500,
) {
  const inFlight = useRef(false);
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; });

  useEffect(() => {
    if (!active || !email || !password) return;
    const tick = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        onResultRef.current(res.ok, data);
      } catch {
        // network hiccup — the next tick retries.
      } finally {
        inFlight.current = false;
      }
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [active, email, password, intervalMs]);
}
