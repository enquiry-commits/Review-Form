import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeKPIs: string[];
  departments: string[];
  dateRange: { start: string; end: string };
  reportType: 'raw' | 'summary' | 'grouped';
}

export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const rows = data.map(item =>
    headers.map(h => {
      const value = item[h];
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
}

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(data: any[], filename: string) {
  // 简单的 HTML 表格转 PDF
  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${filename}</h1>
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(v => `<td>${typeof v === 'object' ? JSON.stringify(v) : v}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          Generated on ${new Date().toLocaleString()}
        </p>
      </body>
    </html>
  `;

  const newWindow = window.open('', '', 'width=800,height=600');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
    newWindow.print();
  }
}

export function summarizeData(data: any[], kpis: string[]) {
  const summary = {
    totalSubmissions: data.length,
    submittedCount: data.filter((d: any) => d.status === 'submitted').length,
    draftCount: data.filter((d: any) => d.status === 'draft').length,
    byDepartment: {} as Record<string, number>,
    kpiStats: {} as Record<string, any>
  };

  // 按部门统计
  data.forEach((d: any) => {
    summary.byDepartment[d.department] = (summary.byDepartment[d.department] || 0) + 1;
  });

  // KPI 统计
  kpis.forEach(kpi => {
    const kpiData = data.map((d: any) => d.form_data?.[kpi]).filter(Boolean);
    summary.kpiStats[kpi] = {
      count: kpiData.length,
      entries: kpiData
    };
  });

  return summary;
}

export function groupByDepartment(data: any[]) {
  const grouped: Record<string, any[]> = {};
  data.forEach(item => {
    if (!grouped[item.department]) {
      grouped[item.department] = [];
    }
    grouped[item.department].push(item);
  });
  return grouped;
}

export function filterByDateRange(data: any[], startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return data.filter(item => {
    if (!item.submitted_at) return false;
    const itemDate = new Date(item.submitted_at).getTime();
    return itemDate >= start && itemDate <= end;
  });
}

export function filterByDepartments(data: any[], departments: string[]) {
  if (departments.length === 0) return data;
  return data.filter(item => departments.includes(item.department));
}
