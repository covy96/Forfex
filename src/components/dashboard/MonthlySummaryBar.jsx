import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MonthlySummaryBar({ incomes = [], expenses = [], year }) {
  const data = MONTHS.map((month, idx) => {
    const m = idx + 1;
    const inc = incomes.filter(i => Number(i.month) === m && Number(i.year) === year)
      .reduce((s, i) => s + Number(i.amount || 0), 0);
    const exp = expenses.filter(e => Number(e.month) === m && Number(e.year) === year)
      .reduce((s, e) => s + Number(e.amount || 0), 0);
    return { month, entrate: inc, uscite: exp };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `€${v.toLocaleString('it-IT')}`} />
        <Legend />
        <Bar dataKey="entrate" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="uscite" fill="#f87171" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
