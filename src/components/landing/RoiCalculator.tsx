import React, { useState } from 'react';
import { Calculator, ArrowRight, TrendingUp, DollarSign, Users, Eye, Sparkles } from 'lucide-react';
import { CountryCode, COUNTRIES, CURRENCIES } from './types';

export const RoiCalculator: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('AO');
  const [budgetIndex, setBudgetIndex] = useState<number>(2); // default tier

  // Budget tiers per country
  const countryBudgets: Record<CountryCode, { values: number[]; labels: string[]; symbol: string }> = {
    AO: {
      values: [50000, 150000, 300000, 600000, 1200000],
      labels: ['50.000 Kz', '150.000 Kz', '300.000 Kz', '600.000 Kz', '1.200.000 Kz+'],
      symbol: 'Kz',
    },
    BR: {
      values: [1000, 2500, 5000, 10000, 20000],
      labels: ['R$ 1.000', 'R$ 2.500', 'R$ 5.000', 'R$ 10.000', 'R$ 20.000+'],
      symbol: 'R$',
    },
    PT: {
      values: [300, 600, 1200, 2500, 5000],
      labels: ['300 €', '600 €', '1.200 €', '2.500 €', '5.000 €+'],
      symbol: '€',
    },
    US: {
      values: [500, 1000, 2500, 5000, 10000],
      labels: ['US$ 500', 'US$ 1.000', 'US$ 2.500', 'US$ 5.000', 'US$ 10.000+'],
      symbol: 'US$',
    },
    OTHER: {
      values: [500, 1000, 2500, 5000, 10000],
      labels: ['$ 500', '$ 1.000', '$ 2.500', '$ 5.000', '$ 10.000+'],
      symbol: '$',
    },
  };

  const currentConfig = countryBudgets[selectedCountry] || countryBudgets.AO;
  const currentBudget = currentConfig.values[budgetIndex] || currentConfig.values[2];
  const currentBudgetLabel = currentConfig.labels[budgetIndex] || currentConfig.labels[2];

  // Estimation logic
  let estimatedReach = 0;
  let estimatedClicks = 0;
  let estimatedLeads = 0;
  let estimatedRevenue = '';

  if (selectedCountry === 'AO') {
    estimatedReach = Math.round(currentBudget * 0.45);
    estimatedClicks = Math.round(currentBudget * 0.022);
    estimatedLeads = Math.round(currentBudget * 0.004);
    estimatedRevenue = `${(currentBudget * 3.8).toLocaleString('pt-AO')} Kz`;
  } else if (selectedCountry === 'BR') {
    estimatedReach = Math.round(currentBudget * 45);
    estimatedClicks = Math.round(currentBudget * 2.2);
    estimatedLeads = Math.round(currentBudget * 0.38);
    estimatedRevenue = `R$ ${(currentBudget * 4.2).toLocaleString('pt-BR')}`;
  } else {
    estimatedReach = Math.round(currentBudget * 40);
    estimatedClicks = Math.round(currentBudget * 1.8);
    estimatedLeads = Math.round(currentBudget * 0.32);
    estimatedRevenue = `€ ${(currentBudget * 3.9).toLocaleString('pt-PT')}`;
  }

  const handleApplyEstimate = () => {
    const el = document.querySelector('#solicitar');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="calculadora" className="py-20 lg:py-24 bg-white border-y border-[#c4c7c7]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-[#f1edec] px-3.5 py-1 rounded-full text-xs font-semibold text-[#1c1b1b]">
            <Calculator className="w-3.5 h-3.5 text-[#0050d7]" />
            <span>Simulador Interativo</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#1c1b1b] tracking-tight font-display">
            Estime o Retorno das Suas Campanhas
          </h2>

          <p className="text-sm text-[#444747]">
            Selecione seu país e o valor aproximado que deseja investir em anúncios para ver o impacto estimado no seu funil de vendas.
          </p>
        </div>

        {/* Calculator Widget Box */}
        <div className="max-w-4xl mx-auto boro-card p-6 sm:p-10 bg-[#fcf8f8] shadow-lg border border-[#c4c7c7]/40">
          
          {/* Country Selection Tabs */}
          <div className="space-y-2 mb-8">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#747878] block">
              1. Selecione a Moeda / Região da sua Empresa:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => { setSelectedCountry('AO'); setBudgetIndex(2); }}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedCountry === 'AO'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-[#1c1b1b] border-[#c4c7c7]/40 hover:bg-[#f1edec]'
                }`}
              >
                <span className="text-base mr-1.5">🇦🇴</span>
                <span>Angola (Kwanza)</span>
              </button>

              <button
                onClick={() => { setSelectedCountry('BR'); setBudgetIndex(2); }}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedCountry === 'BR'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-[#1c1b1b] border-[#c4c7c7]/40 hover:bg-[#f1edec]'
                }`}
              >
                <span className="text-base mr-1.5">🇧🇷</span>
                <span>Brasil (Real)</span>
              </button>

              <button
                onClick={() => { setSelectedCountry('PT'); setBudgetIndex(2); }}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedCountry === 'PT'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-[#1c1b1b] border-[#c4c7c7]/40 hover:bg-[#f1edec]'
                }`}
              >
                <span className="text-base mr-1.5">🇵🇹</span>
                <span>Portugal (Euro)</span>
              </button>

              <button
                onClick={() => { setSelectedCountry('US'); setBudgetIndex(2); }}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  selectedCountry === 'US'
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-white text-[#1c1b1b] border-[#c4c7c7]/40 hover:bg-[#f1edec]'
                }`}
              >
                <span className="text-base mr-1.5">🇺🇸</span>
                <span>Internacional ($)</span>
              </button>
            </div>
          </div>

          {/* Investment Slider / Level */}
          <div className="space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#747878]">
                2. Investimento Mensal em Anúncios:
              </label>
              <span className="text-xl font-black text-[#0050d7] font-display">
                {currentBudgetLabel}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={currentConfig.values.length - 1}
              step="1"
              value={budgetIndex}
              onChange={(e) => setBudgetIndex(parseInt(e.target.value))}
              className="w-full h-2.5 bg-[#e5e2e1] rounded-lg appearance-none cursor-pointer accent-[#0050d7]"
            />

            <div className="flex justify-between text-[11px] text-[#747878] font-medium px-1">
              <span>{currentConfig.labels[0]}</span>
              <span>{currentConfig.labels[2]}</span>
              <span>{currentConfig.labels[currentConfig.labels.length - 1]}</span>
            </div>
          </div>

          {/* Projection Outputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#c4c7c7]/30">
            <div className="p-4 bg-white rounded-2xl border border-[#c4c7c7]/30">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#747878]">
                <Eye className="w-4 h-4 text-[#0050d7]" />
                <span>Pessoas Alcançadas</span>
              </div>
              <div className="text-2xl font-black text-[#1c1b1b] mt-1 font-display">
                ~{estimatedReach.toLocaleString()}
              </div>
              <span className="text-[10px] text-[#747878]">Impressões qualificadas</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#c4c7c7]/30">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#747878]">
                <Users className="w-4 h-4 text-[#1a6b3a]" />
                <span>Contatos no WhatsApp</span>
              </div>
              <div className="text-2xl font-black text-[#1a6b3a] mt-1 font-display">
                ~{estimatedLeads.toLocaleString()} leads
              </div>
              <span className="text-[10px] text-[#747878]">Prontos para atendimento</span>
            </div>

            <div className="p-4 bg-[#111215] text-white rounded-2xl">
              <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Faturamento Estimado</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-display">
                {estimatedRevenue}
              </div>
              <span className="text-[10px] text-zinc-400">Baseado em taxa média de 3.8x</span>
            </div>
          </div>

          {/* CTA under Calculator */}
          <div className="mt-8 pt-6 border-t border-[#c4c7c7]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#747878] text-center sm:text-left">
              *Projeção estimada com base em benchmarks reais de campanhas operadas pela Codeengine.
            </p>

            <button
              onClick={handleApplyEstimate}
              className="boro-btn-primary w-full sm:w-auto h-11 text-xs px-6 active:scale-95"
            >
              <span>Quero essa projeção no meu negócio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
