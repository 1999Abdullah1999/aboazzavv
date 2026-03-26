export function printReport(title: string, summary: string[], rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    alert('لا توجد بيانات للطباعة');
    return;
  }

  const generatedDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Parse summary to extract income/expenses/profit if available
  const incomeMatch = summary.find((s) => s.includes('دخل') || s.includes('الدخل'));
  const expenseMatch = summary.find((s) => s.includes('مصروف') || s.includes('المصروفات'));
  const profitMatch = summary.find((s) => s.includes('ربح') || s.includes('صافي'));

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const tableRows = rows
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value = row[col];
          const isIncome = (col === 'المبلغ' || col === 'الدخل' || col === 'مدين') && (row['النوع'] === 'نقلة' || row['النوع'] === 'دفعة' || col === 'الدخل');
          const isExpense = (col === 'المبلغ' || col === 'المصروفات' || col === 'دائن') && (row['النوع'] === 'مصروف' || col === 'المصروفات' || col === 'دائن');
          const colorStyle = isIncome ? 'color:#16a34a;font-weight:600;' : isExpense ? 'color:#dc2626;font-weight:600;' : '';
          const display = typeof value === 'number' ? value.toLocaleString('ar-EG') : String(value ?? '—');
          return `<td style="padding:8px 12px;border:1px solid #e2e8f0;${colorStyle}">${display}</td>`;
        })
        .join('');
      return `<tr style="border-bottom:1px solid #e2e8f0;">${cells}</tr>`;
    })
    .join('');

  const headerCells = columns
    .map((col) => `<th style="padding:10px 12px;background:#1e40af;color:white;text-align:right;border:1px solid #1d4ed8;font-weight:600;">${col}</th>`)
    .join('');

  const summaryCards = [incomeMatch, expenseMatch, profitMatch]
    .filter(Boolean)
    .map((line, i) => {
      const colors = ['#dcfce7;border-color:#16a34a;color:#15803d', '#fee2e2;border-color:#dc2626;color:#b91c1c', '#f0f9ff;border-color:#1d4ed8;color:#1e40af'];
      return `<div style="flex:1;min-width:180px;background:${colors[i]};padding:16px 20px;border-radius:10px;border:2px solid;">
        <p style="margin:0;font-size:13px;opacity:0.8;">${line?.split(':')[0] ?? ''}</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:700;">${line?.split(':').slice(1).join(':').trim() ?? ''}</p>
      </div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #fff;
      color: #1e293b;
      font-size: 14px;
      direction: rtl;
    }
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 40px 60px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .app-name {
      font-size: 22px;
      font-weight: 800;
      color: #1e40af;
      letter-spacing: 0.5px;
    }
    .report-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 6px;
    }
    .meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .summary-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      border-right: 4px solid #1e40af;
      padding-right: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      font-size: 13px;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer {
      border-top: 2px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer-totals {
      display: flex;
      gap: 24px;
    }
    .footer-totals span {
      font-weight: 600;
      color: #1e293b;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="app-name">🚛 أولاد سليم للنقل</div>
      <div class="report-title">${title}</div>
      <div class="meta">تاريخ الإنشاء: ${generatedDate}</div>
    </div>

    ${summaryCards ? `<div class="summary-row">${summaryCards}</div>` : ''}

    <div class="section-title">تفاصيل البيانات</div>

    <table>
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer">
      <div class="footer-totals">
        ${summary.map((line) => `<div>${line.split(':')[0]}: <span>${line.split(':').slice(1).join(':').trim()}</span></div>`).join('')}
      </div>
      <div>تم الإنشاء بواسطة النظام</div>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
