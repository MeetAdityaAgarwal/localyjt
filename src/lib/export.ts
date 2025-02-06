import { utils, writeFile } from 'xlsx';

export type ExportFormat = 'xlsx' | 'csv' | 'json';

export async function exportData(
  data: any[],
  format: ExportFormat,
  filename: string
) {
  switch (format) {
    case 'xlsx':
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(data);
      utils.book_append_sheet(wb, ws, 'Data');
      writeFile(wb, `${filename}.xlsx`);
      break;
    case 'csv':
      const csv = utils.sheet_to_csv(utils.json_to_sheet(data));
      downloadFile(csv, `${filename}.csv`, 'text/csv');
      break;
    case 'json':
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${filename}.json`, 'application/json');
      break;
  }
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}