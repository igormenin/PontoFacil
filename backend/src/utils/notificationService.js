import axios from 'axios';
import { env } from '../config/env.js';

/**
 * Envia uma notificação push para um ou mais usuários via OneSignal (usando External User ID)
 * @param {Object} params
 * @param {string|string[]} params.userIds - ID(s) do(s) usuário(s) no banco de dados (ex: '1' ou ['1', '2'])
 * @param {string} params.title - Título da notificação
 * @param {string} params.message - Mensagem da notificação
 * @param {Object} [params.data] - Dados adicionais customizados a serem enviados com o push (opcional)
 */
export const sendNotification = async ({ userIds, subscriptionIds, title, message, data = {}, toAll = false }) => {
  const appId = env.ONESIGNAL.APP_ID;
  const apiKey = env.ONESIGNAL.REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn('[OneSignal] Credenciais não configuradas no .env. Ignorando envio de notificação.');
    return null;
  }

  const payload = {
    app_id: appId,
    headings: { pt: title, en: title },
    contents: { pt: message, en: message },
    data: data,
    android_sound: 'notification_sound'
  };

  if (toAll) {
    // Envia para todos os inscritos utilizando o segmento padrão do OneSignal
    payload.included_segments = ['Total Subscriptions'];
  } else {
    payload.target_channel = 'push';
    
    if (subscriptionIds) {
      // Envia para dispositivos específicos pelo ID de inscrição do OneSignal
      payload.include_subscription_ids = Array.isArray(subscriptionIds) 
        ? subscriptionIds.map(id => id.toString()) 
        : [subscriptionIds.toString()];
    } else if (userIds) {
      // Garante que os IDs sejam tratados como strings
      const targets = Array.isArray(userIds) 
        ? userIds.map(id => id.toString()) 
        : [userIds.toString()];
      
      payload.include_aliases = {
        external_id: targets
      };
    } else {
      console.error('[OneSignal] Erro: Você deve especificar "userIds", "subscriptionIds" ou definir "toAll: true".');
      throw new Error('Você deve especificar "userIds", "subscriptionIds" ou definir "toAll: true" para enviar a notificação.');
    }
  }

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`
        }
      }
    );

    const targetDescription = toAll ? 'todos os usuários' : `os IDs: [${userIds}]`;
    console.log(`[OneSignal] Notificação enviada com sucesso para ${targetDescription}. ID da notificação: ${response.data.id}`);
    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[OneSignal ERROR] Falha ao enviar notificação:', errorDetails);
    throw error;
  }
};
