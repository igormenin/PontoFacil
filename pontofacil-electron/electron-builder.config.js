/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'com.pontofacil.app',
  productName: 'Ponto Fácil',
  copyright: `Copyright © ${new Date().getFullYear()} Ponto Fácil`,
  forceCodeSigning: false,
  asar: true,
  directories: {
    output: 'release',
    buildResources: 'build'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'node_modules/electron-store/**/*',
    // Exclude dev-only files
    '!node_modules/.cache/**/*'
  ],
  extraMetadata: {
    main: 'electron/main.js'
  },
  // Icon: 256x256 PNG at build/icon.png
  win: {
    icon: 'build/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    artifactName: '${productName}-${version}-Setup.${ext}'
  },
  portable: {
    artifactName: '${productName}-${version}-Portable.${ext}'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    shortcutName: 'Ponto Fácil',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    installerHeaderIcon: 'build/icon.ico'
  },
  publish: null
};

export default config;
