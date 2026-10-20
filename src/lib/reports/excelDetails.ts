import type ExcelJS from 'exceljs';
import type { FinancialReport } from './financialReportData';
import { COLORS, DATE_FORMAT, FONT, headerRow, moneyFormat, printSetup, styleDataRow, titleBand, toDate, totalRow } from './excelStyle';

const right = { horizontal: 'right' as const, vertical: 'middle' as const };

// "Movimentos": cada entrada e saída do período, com o saldo acumulado linha a linha.
export function addMovementsSheet(wb: ExcelJS.Workbook, r: FinancialReport) {
  const ws = wb.addWorksheet('Movimentos', { properties: { tabColor: { argb: 'FF2563EB' } } });
  const money = moneyFormat(r.currency);
  ws.columns = [{ width: 12 }, { width: 10 }, { width: 22 }, { width: 44 }, { width: 24 }, { width: 28 }, { width: 18 }, { width: 15 }, { width: 15 }, { width: 16 }];
  titleBand(ws, 10, 'Movimentos de caixa', `${r.periodLabel} · cada linha é dinheiro que entrou ou saiu · saldo acumulado à direita`);
  headerRow(ws, 5, ['Data', 'Tipo', 'Categoria', 'Descrição', 'Cliente', 'Projeto', 'Reserva', 'Entrada', 'Saída', 'Saldo'], [8, 9, 10]);

  const opening = ws.getRow(6);
  opening.values = ['', '', '', 'Saldo no início do período', '', '', '', '', '', r.summary.opening];
  styleDataRow(opening, 10, 0);
  opening.getCell(4).font = { name: FONT, size: 10, italic: true, color: { argb: COLORS.muted } };
  opening.getCell(10).numFmt = money;
  opening.getCell(10).alignment = right;

  let row = 7;
  r.movements.forEach((m, i) => {
    const x = ws.getRow(row);
    x.values = [toDate(m.date), m.kind, m.category, m.description, m.client, m.project, m.reserve, m.inflow || null, m.outflow || null, m.balance];
    styleDataRow(x, 10, i + 1);
    x.getCell(1).numFmt = DATE_FORMAT;
    [3, 4, 5, 6, 7].forEach((c) => { x.getCell(c).alignment = { vertical: 'middle', wrapText: true, indent: 1 }; });
    x.getCell(2).font = { name: FONT, size: 10, bold: true, color: { argb: m.kind === 'Entrada' ? COLORS.green : COLORS.red } };
    [8, 9, 10].forEach((c) => { x.getCell(c).numFmt = money; x.getCell(c).alignment = right; });
    x.getCell(8).font = { name: FONT, size: 10, color: { argb: COLORS.green } };
    x.getCell(9).font = { name: FONT, size: 10, color: { argb: COLORS.red } };
    x.getCell(10).font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.ink } };
    row++;
  });

  const t = ws.getRow(row);
  t.getCell(4).value = 'Totais do período';
  t.getCell(8).value = { formula: `SUM(H7:H${row - 1})` };
  t.getCell(9).value = { formula: `SUM(I7:I${row - 1})` };
  t.getCell(10).value = r.summary.closing;
  totalRow(t, 10);
  [8, 9, 10].forEach((c) => { t.getCell(c).numFmt = money; t.getCell(c).alignment = right; });

  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(6, row - 1), column: 10 } };
  printSetup(ws, true, '5:5');
  ws.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
}

// "Projetos": valor contratado, pago e em falta de cada projeto.
export function addProjectsSheet(wb: ExcelJS.Workbook, r: FinancialReport) {
  const ws = wb.addWorksheet('Projetos', { properties: { tabColor: { argb: 'FF15846E' } } });
  const money = moneyFormat(r.currency);
  ws.columns = [{ width: 38 }, { width: 26 }, { width: 16 }, { width: 18 }, { width: 12 }, { width: 14 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 }];
  titleBand(ws, 10, 'Projetos', `${r.periodLabel} · pago não quer dizer concluído: o estado muda quando o projeto é entregue`);
  headerRow(ws, 5, ['Projeto', 'Cliente', 'Categoria', 'Estado', 'Início', 'Entrega', 'Valor total', 'Pago', 'Em falta', '% pago'], [7, 8, 9, 10]);
  let row = 6;
  r.projects.forEach((p, i) => {
    const x = ws.getRow(row);
    x.values = [p.name, p.client, p.category, p.status, toDate(p.start), p.due ? toDate(p.due) : 'Indefinida', p.total, p.paid, p.missing, p.pct];
    styleDataRow(x, 10, i);
    x.getCell(5).numFmt = DATE_FORMAT;
    x.getCell(6).numFmt = DATE_FORMAT;
    [1, 2].forEach((c) => { x.getCell(c).alignment = { vertical: 'middle', wrapText: true, indent: 1 }; });
    [7, 8, 9].forEach((c) => { x.getCell(c).numFmt = money; x.getCell(c).alignment = right; });
    x.getCell(10).numFmt = '0%';
    x.getCell(10).alignment = right;
    const statusColor = p.status === 'Concluído' ? [COLORS.green, COLORS.greenSoft] : p.status === 'Cancelado' ? [COLORS.red, COLORS.redSoft] : p.status === 'Aguardando cliente' ? [COLORS.amber, COLORS.amberSoft] : ['FF1D4ED8', 'FFE0E9FF'];
    x.getCell(4).font = { name: FONT, size: 10, bold: true, color: { argb: statusColor[0] } };
    x.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColor[1] } };
    if (p.missing > 0) x.getCell(9).font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.amber } };
    row++;
  });
  const t = ws.getRow(row);
  t.getCell(1).value = `Total (${r.projects.length} projetos)`;
  ['G', 'H', 'I'].forEach((col, i) => { t.getCell(7 + i).value = { formula: `SUM(${col}6:${col}${row - 1})` }; });
  totalRow(t, 10);
  [7, 8, 9].forEach((c) => { t.getCell(c).numFmt = money; t.getCell(c).alignment = right; });
  printSetup(ws, true, '5:5');
  ws.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
}

// "Caixa e sócios": reservas e distribuições, com o que já foi enviado e o que falta.
export function addCashSheet(wb: ExcelJS.Workbook, r: FinancialReport) {
  const ws = wb.addWorksheet('Caixa e sócios', { properties: { tabColor: { argb: 'FF8052FF' } } });
  const money = moneyFormat(r.currency);
  ws.columns = [{ width: 14 }, { width: 30 }, { width: 44 }, { width: 16 }, { width: 16 }, { width: 16 }];
  titleBand(ws, 6, 'Caixa e sócios', 'Reservas (dinheiro em caixa com destino) e distribuição do resultado pelos sócios');

  const label = (row: number, text: string) => {
    ws.mergeCells(row, 1, row, 6);
    const c = ws.getCell(row, 1);
    c.value = text.toUpperCase();
    c.font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.accent } };
    ws.getRow(row).height = 24;
  };

  label(5, 'Reservas');
  headerRow(ws, 6, ['Data', 'Reserva', 'Notas', 'Reservado', 'Gasto', 'Disponível'], [4, 5, 6]);
  let row = 7;
  r.reserves.forEach((x, i) => {
    const rr = ws.getRow(row);
    rr.values = [toDate(x.date), x.name, x.notes, x.allocated, x.used, x.remaining];
    styleDataRow(rr, 6, i);
    rr.getCell(1).numFmt = DATE_FORMAT;
    rr.getCell(3).alignment = { vertical: 'middle', wrapText: true, indent: 1 };
    [4, 5, 6].forEach((c) => { rr.getCell(c).numFmt = money; rr.getCell(c).alignment = right; });
    rr.getCell(6).font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.ink } };
    row++;
  });
  if (r.reserves.length === 0) { ws.getCell(row, 2).value = 'Sem reservas abertas.'; row++; }
  else {
    const t = ws.getRow(row);
    t.getCell(2).value = 'Total reservado';
    t.getCell(6).value = r.cash.reserved;
    totalRow(t, 6);
    t.getCell(6).numFmt = money;
    t.getCell(6).alignment = right;
    row++;
  }

  row += 1;
  label(row, 'Distribuição aos sócios');
  row++;
  headerRow(ws, row, ['Data', 'Sócio', 'Descrição', 'Valor', 'Estado', ''], [4]);
  row++;
  r.distributions.forEach((d, i) => {
    const x = ws.getRow(row);
    x.values = [toDate(d.date), d.partner, d.description, d.amount, d.sent ? 'Enviado' : 'Por enviar', ''];
    styleDataRow(x, 6, i);
    x.getCell(1).numFmt = DATE_FORMAT;
    x.getCell(4).numFmt = money;
    x.getCell(4).alignment = right;
    x.getCell(5).font = { name: FONT, size: 10, bold: true, color: { argb: d.sent ? COLORS.green : COLORS.amber } };
    x.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: d.sent ? COLORS.greenSoft : COLORS.amberSoft } };
    row++;
  });
  if (r.distributions.length === 0) ws.getCell(row, 2).value = 'Sem distribuições registadas.';
  else {
    const t = ws.getRow(row);
    t.getCell(2).value = 'Por enviar';
    t.getCell(4).value = r.cash.owed;
    totalRow(t, 6);
    t.getCell(4).numFmt = money;
    t.getCell(4).alignment = right;
  }
  printSetup(ws, false);
}
