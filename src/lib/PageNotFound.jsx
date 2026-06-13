import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <h1 className="text-4xl font-bold text-slate-800">404</h1>
            <p className="text-slate-600">Pagina non trovata: <strong>{pageName || 'home'}</strong></p>
            <a href="/" className="text-blue-600 hover:underline">Torna alla Dashboard</a>
        </div>
    );
}
