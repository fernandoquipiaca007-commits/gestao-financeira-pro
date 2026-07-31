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
    <div className="max-w-3xl mx-auto space-y-8 pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          Configurações do Sistema
        </h2>
        <p className="text-xs text-slate-600 font-bold mt-0.5">
          Personalize a moeda padrão, cotações de câmbio, dados do operador e backups
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-6">
        
        {/* Default Currency Section */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <label className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
            Moeda Padrão para Novos Projetos
          </label>
          <p className="text-xs text-slate-600 font-semibold">
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
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{curr.flag}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />}
                  </div>
                  <div className="mt-3">
                    <span className="font-black text-sm block text-slate-900">{curr.code}</span>
                    <span className="text-xs text-slate-600 font-bold">{curr.symbol} ({curr.name})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exchange Rates Config */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600 stroke-[2.2]" />
            Cotação de Câmbio (Referência 1 BRL)
          </h3>
          <p className="text-xs text-slate-600 font-semibold">
            Defina a taxa de conversão para consolidar totais nos relatórios multi-moeda.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-black text-slate-800 block mb-1">🇦🇴 1 BRL em Kz (AOA)</label>
              <input
                type="number"
                step="any"
                value={rateAoa}
                onChange={(e) => setRateAoa(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-emerald-700 font-black text-sm"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-black text-slate-800 block mb-1">🇺🇸 1 BRL em Dólares (USD)</label>
              <input
                type="number"
                step="any"
                value={rateUsd}
                onChange={(e) => setRateUsd(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-blue-700 font-black text-sm"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-black text-slate-800 block mb-1">🇵🇹 1 BRL em Euros (EUR)</label>
              <input
                type="number"
                step="any"
                value={rateEur}
                onChange={(e) => setRateEur(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-purple-700 font-black text-sm"
              />
            </div>
          </div>
        </div>

        {/* Business & User Info */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            Dados do Perfil
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">Seu Nome / Nome de Gestor</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-800 block mb-1">Nome da Empresa / Studio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Studio Digital Pro"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-1">
              <Check className="w-4 h-4 stroke-[3]" /> Configurações salvas com sucesso!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </form>

      {/* Backup & Data Management */}
      <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 stroke-[2.2]" />
            Exportar &amp; Importar Dados (Backup Seguro)
          </h3>
          <p className="text-xs text-slate-600 font-semibold mt-1">
            Faça um backup completo dos seus clientes, projetos e finanças para arquivo ou migração entre dispositivos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-black text-slate-900 block">Exportar Backup</span>
            <p className="text-xs text-slate-600 font-semibold">Baixe um arquivo .json contendo todos os registros.</p>
            <button
              type="button"
              onClick={onExportData}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-black text-slate-900 block">Restaurar Backup</span>
            <p className="text-xs text-slate-600 font-semibold">Carregue um arquivo .json anteriormente exportado.</p>
            <label className="mt-2 inline-flex px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold items-center space-x-2 transition-all cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Selecionar Arquivo Backup</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Reset or Clear Data Section */}
      <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-600 stroke-[2.2]" />
            Gerenciamento de Dados
          </h3>
          <p className="text-xs text-slate-600 font-semibold mt-1">
            Limpar o cache local ou apagar permanentemente todos os registros do sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reload from DB */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-slate-700" /> Recarregar Dados do Banco
            </span>
            <p className="text-xs text-slate-600 font-semibold">
              Limpa o cache local do navegador e recarrega todos os dados diretamente do Supabase.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Limpar cache local e recarregar os dados do banco agora?')) {
                  onResetData();
                }
              }}
              className="mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Recarregar do Supabase
            </button>
          </div>

          {/* Clear all data */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <span className="text-xs font-black text-rose-800 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-700" /> Apagar Cache Local
            </span>
            <p className="text-xs text-slate-600 font-semibold">
              Remove os dados em cache no navegador. Os dados no Supabase não serão apagados.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apagar o cache local do navegador? Os dados no banco de dados permanecem intactos.')) {
                  onClearData();
                }
              }}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Limpar Cache Local
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

