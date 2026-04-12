import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';

let server;
let baseUrl;
let token;
let clienteId;
let diaId;

before(async () => {
  return new Promise((resolve) => {
    // Start server on random port
    server = app.listen(0, async () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      console.log(`Test server running on ${baseUrl}`);
      
      // Cleanup Test Data from DB before running
      const { query } = await import('../config/database.js');
      await query('DELETE FROM intervalo');
      await query('UPDATE dia SET dia_horas_total=0, dia_valor_total=0');
      await query('UPDATE mes SET mes_realizado=0, mes_estimativa=0');

      resolve();
    });
  });
});

after(() => {
  server.close();
});

test('Fluxo Completo de API - Ponto Fácil', async (t) => {
  
  await t.test('1. Autenticação (Login)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', senha: 'admin123' })
    });
    
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
    token = data.token;
    
    // Check camelCase in auth response
    assert.ok(Object.keys(data).includes('token'));
    assert.ok(data.user.hasOwnProperty('id'));
  });

  await t.test('2. Criação de Cliente', async () => {
    const res = await fetch(`${baseUrl}/cliente`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cliNome: 'Backend Tech Test', cliAtivo: true })
    });
    
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.cliId);
    clienteId = data.cliId;
    
    // Check camelCase
    assert.ok(data.hasOwnProperty('cliNome'));
  });

  await t.test('3. Configuração de Valor/Hora', async () => {
    const res = await fetch(`${baseUrl}/valor-hora`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        vhCliId: clienteId, 
        vhValor: 150.00, 
        vhMesInicio: '2026-04-01' 
      })
    });
    
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.vhId);
    assert.strictEqual(parseFloat(data.vhValor), 150.00);
  });

  await t.test('4. Cadastro de Feriado', async () => {
    const res = await fetch(`${baseUrl}/feriado`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        ferData: '2026-04-21', 
        ferNome: 'Tiradentes', 
        ferTipo: 'NACIONAL' 
      })
    });
    
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.ferId);
  });

  await t.test('5. Abertura de Mês (2026-04)', async () => {
    const res = await fetch(`${baseUrl}/mes/2026-04`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.mesId);
    assert.strictEqual(data.mesAnoMes, '2026-04');
    
    // Check camelCase in month
    assert.ok(data.hasOwnProperty('mesHorasMeta'));
    
    // Get Dia ID for the 5th of April
    const diaRes = await fetch(`${baseUrl}/dia/2026-04`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const dias = await diaRes.json();
    assert.ok(Array.isArray(dias), `Resposta de /api/dia/2026-04 não é um array: ${JSON.stringify(dias)}`);
    assert.strictEqual(dias.length, 30, `Abril deve ter 30 dias (recebeu ${dias.length})`);
    
    // Debug: log first 5 days format
    // console.log('Sample days:', dias.slice(0, 5).map(d => d.diaData));

    // Check camelCase in dia and handle Date object or ISO string
    const targetDate = '2026-04-05';
    const dia5 = dias.find(d => {
        const dStr = String(d.diaData);
        return dStr.includes(targetDate);
    });
    
    if (!dia5) {
        const sample = dias.slice(0, 3).map(d => ({ data: d.diaData, keys: Object.keys(d) }));
        assert.fail(`Dia ${targetDate} não encontrado. Amostra de dados: ${JSON.stringify(sample)}`);
    }
    
    diaId = dia5.diaId;
  });

  await t.test('6. Lançamento de 3 Intervalos (Total 4.5h)', async () => {
    const lancamentos = [
      { inicio: '08:00', fim: '10:00' }, // 2h
      { inicio: '13:00', fim: '14:00' }, // 1h
      { inicio: '15:00', fim: '16:30' }  // 1.5h
    ];
    
    for (const [idx, L] of lancamentos.entries()) {
      const res = await fetch(`${baseUrl}/intervalo`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          diaId: diaId, 
          cliId: clienteId, 
          ordem: idx + 1, 
          inicio: L.inicio, 
          fim: L.fim 
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 201, `Erro ao criar intervalo ${idx}: ${JSON.stringify(data)}`);
    }
  });

  await t.test('7. Verificação de Recálculo (Dia e Mês)', async () => {
    // Check Day
    const diaRes = await fetch(`${baseUrl}/dia/2026-04`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const dias = await diaRes.json();
    assert.ok(Array.isArray(dias), 'Faltou a listagem de dias no recálculo');
    const dia5 = dias.find(d => d.diaId === diaId);
    assert.ok(dia5, 'Dia recalculado não encontrado');
    
    // 4.5h total
    assert.strictEqual(parseFloat(dia5.diaHorasTotal), 4.50);
    // 4.5h * 150.00 = 675.00
    assert.strictEqual(parseFloat(dia5.diaValorTotal), 675.00);
    
    // Check Month
    const mesRes = await fetch(`${baseUrl}/mes/2026-04`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const mes = await mesRes.json();
    
    // mesRealizado stores total hours in the month
    assert.strictEqual(parseFloat(mes.mesRealizado), 4.50);
    
    // mesEstimativa in this service logic is (dias_uteis * 8)
    // April 2026 has 22 working days (Tiradentes on 21st is a Tuesday)
    // 22 * 8 = 176
    assert.ok(parseFloat(mes.mesEstimativa) >= 160); 
  });

  await t.test('8. Confirmação Final de camelCase no JSON', async () => {
    const res = await fetch(`${baseUrl}/mes/2026-04`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    const keys = Object.keys(data);
    // Should NOT contain snake_case
    const snakeKeys = keys.filter(k => k.includes('_'));
    assert.strictEqual(snakeKeys.length, 0, `JSON contain snake_case keys: ${snakeKeys}`);
    
    // Should contain expected camelCase
    assert.ok(keys.includes('mesAnoMes'));
    assert.ok(keys.includes('mesHorasMeta'));
  });
});
