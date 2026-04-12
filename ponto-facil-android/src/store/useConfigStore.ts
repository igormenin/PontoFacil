import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConfigState {
  metaHorasDia: number;
  setMetaHorasDia: (horas: number) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  metaHorasDia: 8,
  setMetaHorasDia: async (horas) => {
    await AsyncStorage.setItem('config_meta_horas', horas.toString());
    set({ metaHorasDia: horas });
  },
  initialize: async () => {
    const horas = await AsyncStorage.getItem('config_meta_horas');
    if (horas) {
      set({ metaHorasDia: parseInt(horas, 10) });
    }
  },
}));
