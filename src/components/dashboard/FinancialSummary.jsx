import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Calculator } from "lucide-react";

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function SummaryCard({ title, value, subtitle, icon: Icon, trend, className = "" }) {
  return (
    <Card className={`rounded-2xl bg-white border border-slate-100 shadow-apple hover-lift ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${trend === 'up' ? 'bg-emerald-50' : trend === 'down' ? 'bg-rose-50' : 'bg-slate-50'}`}>
            <Icon className={`w-5 h-5 ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FinancialSummary({ 
  totalProfessionalIncome = 0,
  totalPersonalIncome = 0,
  totalExpenses = 0,
  estimatedTax = 0,
  estimatedInarcassa = 0,
  availableCash = 0,
  year
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Riepilogo {year}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Fatturato Professionale"
          value={formatCurrency(totalProfessionalIncome)}
          icon={TrendingUp}
          trend="up"
        />
        <SummaryCard 
          title="Entrate Personali"
          value={formatCurrency(totalPersonalIncome)}
          icon={TrendingUp}
          trend="up"
        />
        <SummaryCard 
          title="Spese Totali"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          trend="down"
        />
        <SummaryCard 
          title="Disponibilità Reale"
          value={formatCurrency(availableCash)}
          subtitle="Al netto degli accantonamenti"
          icon={Wallet}
          trend={availableCash > 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-apple-lg bg-gradient-to-br from-slate-800 to-slate-900 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Imposta Sostitutiva Stimata</p>
                <p className="text-3xl font-semibold">{formatCurrency(estimatedTax)}</p>
                <p className="text-xs text-slate-400">Da versare anno prossimo</p>
              </div>
              <Calculator className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-apple-lg bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Contributi Inarcassa Stimati</p>
                <p className="text-3xl font-semibold">{formatCurrency(estimatedInarcassa)}</p>
                <p className="text-xs text-indigo-200">Soggettivo + Integrativo + Maternità</p>
              </div>
              <Calculator className="w-8 h-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}