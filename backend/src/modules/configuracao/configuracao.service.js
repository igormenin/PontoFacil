import { query } from '../../config/database.js';
import { keysToCamel } from '../../utils/mapper.js';

export const getConfig = async () => {
  const result = await query('SELECT * FROM configuracao_smtp ORDER BY updated_at DESC LIMIT 1');
  return keysToCamel(result.rows[0]);
};

export const updateConfig = async (data) => {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromEmail, smtpFromName, smtpSecure } = data;
  
  // We keep only one record for now (the latest)
  const current = await getConfig();
  
  if (current) {
    await query(
      `UPDATE configuracao_smtp 
       SET smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_pass = $4, 
           smtp_from_email = $5, smtp_from_name = $6, smtp_secure = $7, updated_at = NOW()
       WHERE smtp_id = $8`,
      [smtpHost, smtpPort, smtpUser, smtpPass, smtpFromEmail, smtpFromName, smtpSecure, current.smtpId]
    );
  } else {
    await query(
      `INSERT INTO configuracao_smtp (smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_email, smtp_from_name, smtp_secure)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [smtpHost, smtpPort, smtpUser, smtpPass, smtpFromEmail, smtpFromName, smtpSecure]
    );
  }
  
  return true;
};
