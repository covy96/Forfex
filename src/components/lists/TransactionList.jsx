import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

export default function TransactionList({ items = [], type = 'income', onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        Nessuna {type === 'income' ? 'entrata' : 'uscita'} registrata
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-apple transition-all">
          <div className="flex-1">
            <p className="font-medium text-slate-800">{item.description}</p>
            <p className="text-sm text-slate-500">{item.date}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {type === 'income' ? '+' : '-'}€{Number(item.amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </span>
            {onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => onDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
