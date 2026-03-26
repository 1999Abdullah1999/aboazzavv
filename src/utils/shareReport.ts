import html2canvas from 'html2canvas';

/**
 * Generates the same beautiful print-style HTML, renders it in a hidden container,
 * captures it as an image, then shares or downloads it.
 */
export async function shareReportAsImage(
  title: string,
  summary: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) {
    throw new Error('لا توجد بيانات للمشاركة');
  }

  const generatedDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  // Create a hidden container with the same print layout
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:900px;background:#fff;z-index:-1;';
  container.innerHTML = `
    <div style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#fff;color:#1e293b;font-size:14px;direction:rtl;padding:40px 40px 60px;max-width:900px;">
      <div style="text-align:center;border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:28px;">
        <div style="font-size:22px;font-weight:800;color:#1e40af;">🚛 أولاد سليم للنقل</div>
        <div style="font-size:18px;font-weight:700;color:#1e293b;margin-top:6px;">${title}</div>
        <div style="font-size:12px;color:#64748b;margin-top:8px;">تاريخ الإنشاء: ${generatedDate}</div>
      </div>

      ${summaryCards ? `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;">${summaryCards}</div>` : ''}

      <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px;border-right:4px solid #1e40af;padding-right:10px;">تفاصيل البيانات</div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div style="border-top:2px solid #e2e8f0;padding-top:16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b;">
        <div style="display:flex;gap:24px;">
          ${summary.map((line) => `<div>${line.split(':')[0]}: <span style="font-weight:600;color:#1e293b;">${line.split(':').slice(1).join(':').trim()}</span></div>`).join('')}
        </div>
        <div>تم الإنشاء بواسطة النظام</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait for rendering
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 900,
      windowWidth: 900,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('فشل إنشاء الصورة'))), 'image/png');
    });

    const fileName = `${title.replace(/\s+/g, '_')}_${Date.now()}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    // Try native share with file support
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title,
        files: [file],
      });
    } else {
      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } finally {
    document.body.removeChild(container);
  }
}
