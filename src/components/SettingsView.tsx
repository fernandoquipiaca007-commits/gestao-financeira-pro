import React, { useState } from 'react';
import {
  Settings,
  Globe,
  RefreshCw,
  Check,
  User,
  Save,
  DollarSign,
  Download,
  Upload,
  Trash2,
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-[#c4c7c7]/40 p-5 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#444747]" />
          Configurações do Sistema
        </h2>
        <p className="text-xs text-[#747878] mt-0.5">
          Personalize a moeda padrão, cotações de câmbio, dados do operador e backups
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
        
        {/* Default Currency Section */}
        <div className="space-y-3 pb-6 border-b border-[#c4c7c7]/40">
          <label className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0050d7] stroke-[1.5]" />
            Moeda Padrão para Novos Projetos
          </label>
          <p className="text-xs text-[#747878]">
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
                  className={`p-4 rounded-[16px] border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#f1edec] border-[#000000] text-[#1c1b1b] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                      : 'bg-[#f7f3f2] border-[#c4c7c7]/30 text-[#444747] hover:border-[#c4c7c7]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{curr.flag}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#000000] stroke-[2.5]" />}
                  </div>
                  <div className="mt-3">
                    <span className="font-semibold text-sm block text-[#1c1b1b]">{curr.code}</span>
                    <span className="text-xs text-[#747878]">{curr.symbol} ({curr.name})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Exchange Rates Config */}
        <div className="space-y-4 pb-6 border-b border-[#c4c7c7]/40">
          <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#444747] stroke-[1.5]" />
            Cotação de Câmbio (Referência 1 BRL)
          </h3>
          <p className="text-xs text-[#747878]">
            Defina a taxa de conversão para consolidar totais nos relatórios multi-moeda.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-[#f7f3f2] rounded-xl border border-[#c4c7c7]/30">
              <label className="text-xs font-medium text-[#747878] block mb-1">🇦🇴 1 BRL em Kz (AOA)</label>
              <input
                type="number"
                step="any"
                value={rateAoa}
                onChange={(e) => setRateAoa(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#c4c7c7]/35 rounded-lg text-[#1c1b1b] font-medium text-sm focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div className="p-3.5 bg-[#f7f3f2] rounded-xl border border-[#c4c7c7]/30">
              <label className="text-xs font-medium text-[#747878] block mb-1">🇺🇸 1 BRL em Dólares (USD)</label>
              <input
                type="number"
                step="any"
                value={rateUsd}
                onChange={(e) => setRateUsd(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#c4c7c7]/35 rounded-lg text-[#1c1b1b] font-medium text-sm focus:outline-none focus:border-[#000000]"
              />
            </div>

            <div className="p-3.5 bg-[#f7f3f2] rounded-xl border border-[#c4c7c7]/30">
              <label className="text-xs font-medium text-[#747878] block mb-1">🇵🇹 1 BRL em Euros (EUR)</label>
              <input
                type="number"
                step="any"
                value={rateEur}
                onChange={(e) => setRateEur(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-[#c4c7c7]/35 rounded-lg text-[#1c1b1b] font-medium text-sm focus:outline-none focus:border-[#000000]"
              />
            </div>
          </div>
        </div>

        {/* Business & User Info */}
        <div className="space-y-4 pb-6 border-b border-[#c4c7c7]/40">
          <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
            <User className="w-4 h-4 text-[#444747] stroke-[1.5]" />
            Dados do Perfil
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Seu Nome / Nome de Gestor</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">Nome da Empresa / Studio</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Studio Digital Pro"
                className="w-full px-3.5 py-2.5 bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl text-[#1c1b1b] text-sm focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs text-[#1a6b3a] font-semibold flex items-center gap-1">
              <Check className="w-4 h-4 stroke-[2.5]" /> Configurações salvas com sucesso!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2]" />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </form>

      {/* Backup & Data Management */}
      <div className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
            <Download className="w-5 h-5 text-[#0050d7] stroke-[1.5]" />
            Exportar &amp; Importar Dados (Backup Seguro)
          </h3>
          <p className="text-xs text-[#747878] mt-1">
            Faça um backup completo dos seus clientes, projetos e finanças para arquivo ou migração entre dispositivos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 space-y-2">
            <span className="text-xs font-semibold text-[#1c1b1b] block">Exportar Backup</span>
            <p className="text-xs text-[#747878]">Baixe um arquivo .json contendo todos os registros.</p>
            <button
              type="button"
              onClick={onExportData}
              className="mt-2 px-4 py-2 bg-[#000000] hover:opacity-85 text-white rounded-[29px] text-xs font-medium flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo JSON</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 space-y-2">
            <span className="text-xs font-semibold text-[#1c1b1b] block">Restaurar Backup</span>
            <p className="text-xs text-[#747878]">Carregue um arquivo .json anteriormente exportado.</p>
            <label className="mt-2 inline-flex px-4 py-2 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] rounded-[29px] text-xs font-medium items-center space-x-2 transition-all cursor-pointer border border-[#c4c7c7]/40">
              <Upload className="w-3.5 h-3.5" />
              <span>Selecionar Arquivo Backup</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Reset or Clear Data Section */}
      <div className="bg-white border border-[#c4c7c7]/40 p-6 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1c1b1b] flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#747878] stroke-[1.5]" />
            Gerenciamento de Dados
          </h3>
          <p className="text-xs text-[#747878] mt-1">
            Limpar o cache local ou apagar permanentemente todos os registros do sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Reload from DB */}
          <div className="p-4 rounded-[16px] bg-[#f7f3f2] border border-[#c4c7c7]/30 space-y-2">
            <span className="text-xs font-semibold text-[#1c1b1b] flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-[#747878]" /> Recarregar Dados do Banco
            </span>
            <p className="text-xs text-[#747878]">
              Limpa o cache local do navegador e recarrega todos os dados diretamente do Supabase.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Limpar cache local e recarregar os dados do banco agora?')) {
                  onResetData();
                }
              }}
              className="mt-2 px-4 py-2 bg-[#f1edec] hover:bg-[#e5e2e1] text-[#1c1b1b] text-xs font-medium rounded-[29px] transition-all cursor-pointer border border-[#c4c7c7]/40"
            >
              Recarregar do Supabase
            </button>
          </div>

          {/* Clear all data */}
          <div className="p-4 rounded-[16px] bg-[#ffdad6]/40 border border-[#ba1a1a]/20 space-y-2">
            <span className="text-xs font-semibold text-[#93000a] flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-[#ba1a1a]" /> Apagar Cache Local
            </span>
            <p className="text-xs text-[#747878]">
              Remove os dados em cache no navegador. Os dados no Supabase não serão apagados.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apagar o cache local do navegador? Os dados no banco de dados permanecem intactos.')) {
                  onClearData();
                }
              }}
              className="mt-2 px-4 py-2 bg-[#ba1a1a] hover:opacity-85 text-white text-xs font-medium rounded-[29px] transition-all cursor-pointer"
            >
              Limpar Cache Local
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
