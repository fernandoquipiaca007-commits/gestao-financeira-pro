import type { FinancialReport } from './financialReportData';

// Gera o relatório financeiro em Excel (.xlsx), formatado e pronto a imprimir.
// O exceljs só é carregado quando se exporta, para não pesar no arranque da app.
export async function buildFinancialWorkbook(report: FinancialReport) {
  const [{ default: ExcelJS }, { addSummarySheet }, { addMovementsSheet, addProjectsSheet, addCashSheet }] = await Promise.all([
    import('exceljs'),
    import('./excelSummary'),
    import('./excelDetails'),
  ]);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CodeEngine Gestão';
  wb.created = new Date();
  const generatedAt = new Date().toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
  addSummarySheet(wb, report, generatedAt);
  addMovementsSheet(wb, report);
  addProjectsSheet(wb, report);
  addCashSheet(wb, report);
  return wb;
}

export async function downloadFinancialReport(report: FinancialReport, fileName: string) {
  const wb = await buildFinancialWorkbook(report);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
