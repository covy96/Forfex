import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatCurrency(amount) {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function CalcRow({ label, value, isTotal = false, isSubtotal = false }) {
  return (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'font-semibold text-slate-900' : isSubtotal ? 'font-medium text-slate-700' : 'text-slate-600'}`}>
      <span className="text-sm">{label}</span>
      <span className={`text-sm tabular-nums ${isTotal ? 'text-lg' : ''}`}>{formatCurrency(value)}</span>
    </div>
  );
}

export default function TaxCalculator({ 
  professionalIncome = 0,
  settings = {}
}) {
  const {
    tax_rate = 15,
    profitability_coefficient = 78,
    inarcassa_subjective_rate = 14.5,
    inarcassa_integrative_rate = 4,
    inarcassa_maternity_contribution = 75
  } = settings;

  // Calcoli
  const integrativo = professionalIncome * (inarcassa_integrative_rate / 100);
  const totaleFatturato = professionalIncome + integrativo;
  const redditoImponibile = totaleFatturato * (profitability_coefficient / 100);
  const contributoSoggettivo = redditoImponibile * (inarcassa_subjective_rate / 100);
  const baseImponibileFiscale = redditoImponibile - contributoSoggettivo;
  const impostaSostitutiva = baseImponibileFiscale * (tax_rate / 100);
  const contributiInarcassa = contributoSoggettivo + integrativo + inarcassa_maternity_contribution;

  return (
    <Card className="rounded-2xl bg-white border border-slate-100 shadow-apple">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">Calcolo Dettagliato Imposte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Fatturato</p>
          <CalcRow label="Compensi professionali" value={professionalIncome} />
          <CalcRow label={`+ Contributo integrativo (${inarcassa_integrative_rate}%)`} value={integrativo} />
          <Separator className="my-2" />
          <CalcRow label="Totale fatturato" value={totaleFatturato} isSubtotal />
        </div>

        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Reddito</p>
          <CalcRow label={`Coefficiente redditività (${profitability_coefficient}%)`} value={redditoImponibile} />
          <CalcRow label={`- Contributo soggettivo (${inarcassa_subjective_rate}%)`} value={contributoSoggettivo} />
          <Separator className="my-2" />
          <CalcRow label="Base imponibile fiscale" value={baseImponibileFiscale} isSubtotal />
        </div>

        <div className="bg-slate-50 rounded-lg p-4 -mx-2">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Imposte e Contributi Annui</p>
          <CalcRow label={`Imposta sostitutiva (${tax_rate}%)`} value={impostaSostitutiva} />
          <CalcRow label="Contributo soggettivo Inarcassa" value={contributoSoggettivo} />
          <CalcRow label="Contributo integrativo Inarcassa" value={integrativo} />
          <CalcRow label="Contributo maternità" value={inarcassa_maternity_contribution} />
          <Separator className="my-2" />
          <CalcRow label="Totale contributi Inarcassa" value={contributiInarcassa} isSubtotal />
          <div className="mt-3 pt-3 border-t border-slate-200">
            <CalcRow label="TOTALE DA ACCANTONARE" value={impostaSostitutiva + contributiInarcassa} isTotal />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}