import type ExcelJS from 'exceljs';

// Estilo comum do relatório Excel: cores da marca, moeda, cabeçalhos e impressão.

export const COLORS = {
  ink: 'FF1C1B1B',
  muted: 'FF6B6F76',
  band: 'FF141720',
  accent: 'FFF26B1D',
  headerFill: 'FF1F2430',
  zebra: 'FFF7F5F2',
  line: 'FFE4E0DA',
  green: 'FF1A6B3A',
  greenSoft: 'FFE3F4EA',
  red: 'FFB3261E',
  redSoft: 'FFFBE5E3',
  amber: 'FF8A5A00',
  amberSoft: 'FFFFF1D6',
  white: 'FFFFFFFF',
};

export const FONT = 'Calibri';

export function moneyFormat(currency: string): string {
  const symbol = currency === 'BRL' ? 'R$' : currency === 'AOA' ? 'Kz' : currency === 'EUR' ? '€' : 'US$';
  return `"${symbol}" #,##0.00;[Red]-"${symbol}" #,##0.00;"${symbol}" 0.00`;
}

export const DATE_FORMAT = 'dd/mm/yyyy';

export const toDate = (iso: string): Date | string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(Date.UTC(y, m - 1, d)) : iso;
};

const thin = (argb: string): Partial<ExcelJS.Border> => ({ style: 'thin', color: { argb } });

/** Barra de título no topo de cada folha. */
export function titleBand(ws: ExcelJS.Worksheet, cols: number, title: string, subtitle: string) {
  ws.mergeCells(1, 1, 1, cols);
  ws.mergeCells(2, 1, 2, cols);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: FONT, size: 18, bold: true, color: { argb: COLORS.white } };
  t.alignment = { vertical: 'middle', indent: 1 };
  const s = ws.getCell(2, 1);
  s.value = subtitle;
  s.font = { name: FONT, size: 10, color: { argb: 'FFCBD5E1' } };
  s.alignment = { vertical: 'middle', indent: 1 };
  for (let c = 1; c <= cols; c++) {
    ws.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.band } };
    ws.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.band } };
    ws.getCell(3, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.accent } };
  }
  ws.getRow(1).height = 32;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 4;
}

/** Cabeçalho escuro de uma tabela. */
export function headerRow(ws: ExcelJS.Worksheet, rowNumber: number, headers: string[], rightAligned: number[] = []) {
  const row = ws.getRow(rowNumber);
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerFill } };
    cell.alignment = { vertical: 'middle', horizontal: rightAligned.includes(i + 1) ? 'right' : 'left', wrapText: true, indent: 1 };
    cell.border = { bottom: thin(COLORS.accent) };
  });
  row.height = 24;
}

/** Linha de dados com zebra e linha fina por baixo. */
export function styleDataRow(row: ExcelJS.Row, cols: number, index: number) {
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.font = { name: FONT, size: 10, color: { argb: COLORS.ink }, ...(cell.font || {}) };
    if (index % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebra } };
    cell.border = { bottom: thin(COLORS.line) };
    cell.alignment = { vertical: 'middle', indent: 1, ...(cell.alignment || {}) };
  }
  // sem altura fixa: o Excel ajusta a altura ao texto que quebra linha
}

/** Linha de totais a negrito. */
export function totalRow(row: ExcelJS.Row, cols: number) {
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: COLORS.ink } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE8E1' } };
    cell.border = { top: { style: 'medium', color: { argb: COLORS.ink } } };
    cell.alignment = { vertical: 'middle', indent: 1 };
  }
  row.height = 22;
}

/** Folha pronta a imprimir: A4, ajustada à largura, cabeçalho repetido, rodapé com páginas. */
export function printSetup(ws: ExcelJS.Worksheet, landscape: boolean, repeatRows?: string) {
  ws.pageSetup = {
    paperSize: 9,
    orientation: landscape ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.3 },
    horizontalCentered: true,
    ...(repeatRows ? { printTitlesRow: repeatRows } : {}),
  };
  ws.headerFooter = { oddFooter: '&L&8CodeEngine Gestão&C&8&A&R&8Página &P de &N' };
  ws.views = [{ showGridLines: false }];
}
