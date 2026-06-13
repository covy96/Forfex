import React from 'react';

export default function UserNotRegisteredError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <div className="text-6xl">🔒</div>
      <h1 className="text-2xl font-bold text-slate-800">Accesso non autorizzato</h1>
      <p className="text-slate-600 text-center max-w-md">
        Il tuo account non è registrato per questa applicazione.
        Contatta l'amministratore per richiedere l'accesso.
      </p>
    </div>
  );
}
