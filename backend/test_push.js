import { sendNotification } from './src/utils/notificationService.js';

async function runTest() {
  console.log('🔔 Iniciando teste de envio de push via OneSignal para TODOS os usuários...');
  
  try {
    const result = await sendNotification({
      toAll: true,
      title: 'Teste Geral do Ponto Fácil ⏰',
      message: 'Esta é uma notificação push enviada para todos os usuários!',
      data: { click_action: 'test_action', timestamp: new Date().toISOString() }
    });
    
    if (result) {
      console.log('✅ Teste concluído com sucesso!');
      console.log('Detalhes da resposta:', JSON.stringify(result, null, 2));
    } else {
      console.warn('⚠️ O envio retornou vazio. Verifique as credenciais no arquivo .env.');
    }
  } catch (error) {
    console.error('❌ Falha ao executar o teste:', error.response?.data || error.message);
  }
}

runTest();
