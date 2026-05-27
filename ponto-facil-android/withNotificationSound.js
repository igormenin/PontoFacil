const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to automatically copy custom notification sounds
 * to the Android res/raw directory during prebuild.
 */
module.exports = function withNotificationSound(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const soundSource = path.join(projectRoot, 'assets', 'notification_sound.mp3');
      const rawDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');

      if (fs.existsSync(soundSource)) {
        if (!fs.existsSync(rawDir)) {
          fs.mkdirSync(rawDir, { recursive: true });
        }
        fs.copyFileSync(soundSource, path.join(rawDir, 'notification_sound.mp3'));
        console.log('✅ Custom notification sound copied to native resources (res/raw)');
      } else {
        console.warn('⚠️ Warning: assets/notification_sound.mp3 not found. Custom sound copy skipped.');
      }
      return config;
    },
  ]);
};
