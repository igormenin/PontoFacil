import { Dimensions, PixelRatio } from 'react-native';

const { width } = Dimensions.get('window');

// Baseado em um padrão de tela largo (iPhone Plus / Android Largo ~414dp)
const baseWidth = 414;

export const normalize = (size: number) => {
  const scale = width / baseWidth;
  const newSize = size * scale;
  
  // Retorna o tamanho arredondado para o pixel mais próximo
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const screenWidth = width;
export const isSmallDevice = width < 375;
