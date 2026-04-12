import { calculateDuration } from './calcHoras';

export interface ReportData {
  userName: string;
  period: string;
  clientName?: string;
  days: {
    date: string;
    totalHours: number;
    totalValue: number;
    intervals: {
      inicio: string;
      fim: string;
      cliente: string;
      valor: number;
    }[];
  }[];
  summary: {
    totalHours: number;
    totalValue: number;
  };
}

export const generateReportHTML = (data: ReportData) => {
  const rows = data.days.map(day => `
    <tr class="day-row">
      <td class="date-cell">${day.date}</td>
      <td class="intervals-cell">
        ${day.intervals.map(int => `
          <div class="interval-item">
            <span class="time">${int.inicio} - ${int.fim}</span>
            <span class="client">${int.cliente}</span>
          </div>
        `).join('')}
      </td>
      <td class="hours-cell">${day.totalHours.toFixed(2)}h</td>
      <td class="value-cell">R$ ${day.totalValue.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            background-color: #FFF7FF;
            color: #1E1A22;
            padding: 40px;
            margin: 0;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 60px;
          }
          
          .title {
            font-size: 32px;
            font-weight: 700;
            color: #460045;
            letter-spacing: -1px;
          }
          
          .period {
            font-size: 14px;
            color: #9B2F96;
            font-weight: 700;
            text-transform: uppercase;
          }
          
          .user-info {
            margin-bottom: 40px;
          }
          
          .user-name {
            font-size: 24px;
            font-weight: 700;
            color: #1E1A22;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 60px;
          }
          
          .summary-card {
            background-color: #F4EBF6;
            padding: 24px;
            border-radius: 24px;
          }
          
          .summary-label {
            font-size: 12px;
            font-weight: 700;
            color: #9B2F96;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .summary-value {
            font-size: 32px;
            font-weight: 700;
            color: #460045;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          
          th {
            text-align: left;
            padding: 12px;
            font-size: 12px;
            color: #9B2F96;
            text-transform: uppercase;
            border-bottom: 2px solid #F4EBF6;
          }
          
          td {
            padding: 16px 12px;
            border-bottom: 1px solid #F4EBF6;
          }
          
          .date-cell { font-weight: 700; }
          
          .interval-item {
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .interval-item .time { font-weight: 700; }
          .interval-item .client { color: #82737D; margin-left: 8px; }
          
          .hours-cell, .value-cell {
            font-weight: 700;
            text-align: right;
          }
          
          .footer {
            margin-top: 80px;
            text-align: center;
            font-size: 10px;
            color: #D4C1CD;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Ponto Fácil</div>
          <div class="period">${data.period}</div>
        </div>
        
        <div class="user-info">
          <div class="user-name">${data.userName}</div>
          ${data.clientName ? `<div style="color: #9B2F96; font-weight: 700; margin-top: 4px;">Relatório Filtrado: ${data.clientName}</div>` : ''}
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total de Horas</div>
            <div class="summary-value">${data.summary.totalHours.toFixed(1)}h</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Valor Estimado</div>
            <div class="summary-value">R$ ${data.summary.totalValue.toFixed(2)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Intervalos</th>
              <th style="text-align: right;">Total</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        
        <div class="footer">Gerado via Ponto Fácil Android • ${new Date().toLocaleDateString()}</div>
      </body>
    </html>
  `;
};

export const generateReportCSV = (data: ReportData) => {
  const header = ['Data', 'Início', 'Fim', 'Cliente', 'Duração (h)', 'Valor (R$)'].join(';');
  const rows = data.days.flatMap(day => 
    day.intervals.map(int => {
      const duration = int.inicio && int.fim ? calculateDuration(int.inicio, int.fim) : 0;
      return [
        day.date,
        int.inicio,
        int.fim || '',
        int.cliente,
        duration.toFixed(2).replace('.', ','),
        int.valor.toFixed(2).replace('.', ',')
      ].join(';');
    })
  );
  
  // Totais
  rows.push('');
  rows.push(['TOTAIS', '', '', '', data.summary.totalHours.toFixed(2).replace('.', ','), data.summary.totalValue.toFixed(2).replace('.', ',')].join(';'));

  return header + '\n' + rows.join('\n');
};
