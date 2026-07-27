import React, { useState } from 'react';
import {
  Settings,
  Globe,
  RefreshCw,
  Check,
  User,
  Building2,
  Save,
  DollarSign,
  Download,
  Upload,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { AppSettings, CurrencyCode, CURRENCIES } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  onClearData,
  onExportData,
  onImportData,
}) => {
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(settings.defaultCurrency);
  const [userName, setUserName] = useState(settings.userName || '');
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  
  // Exchange rates state
  const [rateAoa, setRateAoa] = useState(settings.exchangeRates?.AOA || 165);
  const [rateUsd, setRateUsd] = useState(settings.exchangeRates?.USD || 0.18);
  const [rateEur, setRateEur] = useState(settings.exchangeRates?.EUR || 0.16);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      defaultCurrency,
      userName,
      businessName,
      exchangeRates: {
        BRL: 1,
        AOA: Number(rateAoa) || 165,
        USD: Number(rateUsd) || 0.18,
        EUR: Number(rateEur) || 0.16,
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-emerald-400" />
          Configurações do Sistema
        </h2>
        <p className="text-sm text-slate-400">
          Personalize a moeda padrão, cotações de câmbio, dados do operador e backups
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        
        {/* Default Currency Section */}
        <div className="space-y-3 pb-6 border-b border-slate-800">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Moeda Padrão para Novos Projetos
          </label>
          <p className="text-xs text-slate-400">
            A moeda selecionada aqui será preenchida automaticamente ao cadastrar novos projetos e clientes no sistema.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
              const curr = CURRENCIES[code];
              const isSelected = defaultCurrency === code;

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setDefaultCurrency(code)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{curr.flag}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="mt-3">
                    <span className="font-bold text-sm block">{curr.code}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{curr.symbol} ({curr.name})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exchange Rates Config */}
        <div className="space-y-4 pb-6 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            Cotação de Câmbio (Referência 1 BRL)
          </h3>
          <p className="text-xs text-slate-400">
            Defina a taxa de conversão para consolidar totais nos relatórios multi-moeda.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/70">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">🇦🇴 1 BRL em Kz (AOA)</label>
              <input
                type="number"
                step="any"
                value={rateAoa}
                onChange={(e) => setRateAoa(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold text-sm"
              />
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/70">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">🇺🇸 1 BRL em Dólares (USD)</label>
              <input
                type="number"
                step="any"
                value={rateUsd}
                onChange={(e) => setRateUsd(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-blue-400 font-bold text-sm"
              />
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/70">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">🇵🇹 1 BRL em Euros (EUR)</label>
              <input
                type="number"
                step="any"
                value={rateEur}
                onChange={(e) => setRateEur(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-indigo-400 font-bold text-sm"
              />
            </div>
          </div>
        </div>

        {/* Business & User Info */}
        <div className="space-y-4 pb-6 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            Dados do Perfil
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Seu Nome / Nome de Gestor</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Nome da Empresa / Studio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Studio Digital Pro"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Configurações salvas com sucesso!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl flex items-center space-x-2 transition-all shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </form>

      {/* Backup & Data Management */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            Exportar & Importar Dados (Backup Seguro)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Faça um backup completo dos seus clientes, projetos e finanças para arquivo ou migração entre dispositivos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold text-white block">Exportar Backup</span>
            <p className="text-[11px] text-slate-400">Baixe um arquivo .json contendo todos os registros.</p>
            <button
              type="button"
              onClick={onExportData}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <span className="text-xs font-bold text-white block">Restaurar Backup</span>
            <p className="text-[11px] text-slate-400">Carregue um arquivo .json anteriormente exportado.</p>
            <label className="mt-2 inline-flex px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold items-center space-x-2 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Selecionar Arquivo Backup</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Reset or Clear Data Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            Gerenciamento de Dados do Sistema
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Escolha entre iniciar do zero para uso real na sua empresa ou restaurar a base de demonstração.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Clear All Data for Real Use */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Iniciar do Zero (Uso Real)
            </span>
            <p className="text-[11px] text-slate-400">
              Remove todos os clientes e projetos de teste para você começar a cadastrar seus dados reais.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os clientes, projetos e registros financeiros atuais para iniciar o sistema limpo para uso real. Deseja prosseguir?')) {
                  onClearData();
                }
              }}
              className="mt-2 px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Limpar Tudo (Iniciar do Zero)
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Carregar Dados de Demonstração
            </span>
            <p className="text-[11px] text-slate-400">
              Restaura a base de testes com clientes de Angola, Brasil, EUA, Portugal e lançamentos em AOA, BRL, USD, EUR.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja restaurar os dados de demonstração?')) {
                  onResetData();
                }
              }}
              className="mt-2 px-4 py-2 bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Restaurar Dados de Teste
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

