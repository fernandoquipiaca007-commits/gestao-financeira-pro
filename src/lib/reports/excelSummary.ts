import type ExcelJS from 'exceljs';
import type { FinancialReport } from './financialReportData';
import { COLORS, FONT, headerRow, moneyFormat, printSetup, styleDataRow, titleBand, totalRow } from './excelStyle';

// Folha "Resumo": indicadores do período, situação do caixa e evolução mês a mês.
export function addSummarySheet(wb: ExcelJS.Workbook, r: FinancialReport, generatedAt: string) {
  const ws = wb.addWorksheet('Resumo', { properties: { tabColor: { argb: COLORS.accent } } });
  const money = moneyFormat(r.currency);
  ws.columns = [{ width: 34 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
  titleBand(ws, 7, `Relatório financeiro — ${r.companyName}`, `${r.periodLabel} · valores em ${r.currency} · gerado em ${generatedAt}`);

  // Bloco de indicadores: rótulo, valor e explicação simples.
  const kpi = (row: number, label: string, value: number | null, note: string, tone?: 'good' | 'bad' | 'warn', pct = false) => {
    const l = ws.getCell(row, 1);
    l.value = label;
    l.font = { name: FONT, size: 11, bold: true, color: { argb: COLORS.ink } };
    l.alignment = { vertical: 'middle', indent: 1 };
    const v = ws.getCell(row, 2);
    v.value = value ?? '—';
    v.numFmt = pct ? '0%' : money;
    const color = tone === 'good' ? COLORS.green : tone === 'bad' ? COLORS.red : tone === 'warn' ? COLORS.amber : COLORS.ink;
    v.font = { name: FONT, size: 12, bold: true, color: { argb: color } };
    v.alignment = { vertical: 'middle', horizontal: 'right' };
    ws.mergeCells(row, 3, row, 7);
    const n = ws.getCell(row, 3);
    n.value = note;
    n.font = { name: FONT, size: 9, italic: true, color: { argb: COLORS.muted } };
    n.alignment = { vertical: 'middle', indent: 1, wrapText: true };
    for (let c = 1; c <= 7; c++) ws.getCell(row, c).border = { bottom: { style: 'thin', color: { argb: COLORS.line } } };
    ws.getRow(row).height = 22;
  };
  const section = (row: number, text: string) => {
    ws.mergeCells(row, 1, row, 7);
    const c = ws.getCell(row, 1);
    c.value = text.toUpperCase();
    c.font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.accent } };
    c.alignment = { vertical: 'bottom', indent: 1 };
    ws.getRow(row).height = 24;
  };

  const s = r.summary;
  section(5, 'Resultado do período');
  kpi(6, 'Recebido', s.received, 'Dinheiro que entrou, pela data em que entrou.', 'good');
  kpi(7, 'Custos do negócio', s.costs, 'Despesas pagas (edição, ferramentas, taxas…). Não inclui retiradas nem sócios.');
  kpi(8, 'Comissões de parceiros', s.commissions, 'Repasses a parceiros de indicação, no mês em que o cliente pagou.');
  kpi(9, 'Lucro', s.profit, 'Recebido − custos − comissões.', s.profit >= 0 ? 'good' : 'bad');
  kpi(10, 'Margem', s.margin, 'Lucro em percentagem do recebido.', undefined, true);
  kpi(11, 'Retiradas e sócios', s.distributions, 'Valores enviados aos sócios ou retirados. Saem do caixa, mas não são custo.', 'warn');

  section(13, 'Caixa do período');
  kpi(14, 'Saldo no início', s.opening, 'Caixa antes do primeiro dia do período.');
  kpi(15, 'Saldo no fim', s.closing, 'Caixa no último dia do período (início + entradas − saídas).', s.closing >= 0 ? 'good' : 'bad');

  section(17, 'Onde está o caixa hoje');
  kpi(18, 'Saldo em caixa', r.cash.now, 'Todo o dinheiro que a empresa tem hoje.', 'good');
  kpi(19, 'Reservado', r.cash.reserved, 'Já tem destino (reservas escritas à mão). Ver folha "Caixa e sócios".');
  kpi(20, 'Por enviar a sócios', r.cash.owed, 'Partes de distribuições ainda não enviadas.', 'warn');
  kpi(21, 'Livre', r.cash.free, 'O que pode ser usado ou distribuído.', r.cash.free >= 0 ? 'good' : 'bad');

  // Evolução mês a mês.
  section(23, 'Mês a mês');
  const headers = ['Mês', 'Recebido', 'Custos', 'Comissões', 'Lucro', 'Sócios / retiradas', 'Fluxo de caixa'];
  headerRow(ws, 24, headers, [2, 3, 4, 5, 6, 7]);
  let row = 25;
  r.months.forEach((m, i) => {
    const x = ws.getRow(row);
    x.values = [m.label, m.received, m.costs, m.commissions, m.profit, m.distributions, m.cashFlow];
    styleDataRow(x, 7, i);
    for (let c = 2; c <= 7; c++) { x.getCell(c).numFmt = money; x.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' }; }
    row++;
  });
  if (r.months.length === 0) {
    ws.getCell(row, 1).value = 'Sem movimentos no período.';
    ws.getCell(row, 1).font = { name: FONT, size: 10, italic: true, color: { argb: COLORS.muted } };
    row++;
  } else {
    const t = ws.getRow(row);
    const first = 25;
    const last = row - 1;
    t.getCell(1).value = 'Total';
    'BCDEFG'.split('').forEach((col, i) => {
      t.getCell(i + 2).value = { formula: `SUM(${col}${first}:${col}${last})` };
    });
    totalRow(t, 7);
    for (let c = 2; c <= 7; c++) { t.getCell(c).numFmt = money; t.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' }; }
  }

  printSetup(ws, false);
}
