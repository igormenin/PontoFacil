import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { LogIn, Lock, User, Clock, Fingerprint } from 'lucide-react-native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/useAuthStore';
import syncApi from '../api/syncApi';

import { normalize } from '../utils/responsive';

const SECURE_AUTH_KEY = 'user_auth_credentials';

export default function LoginScreen() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);


  useEffect(() => {
    checkBiometrics();
    loadSavedCredentials();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const isSupported = compatible && enrolled;
    setIsBiometricSupported(isSupported);
    return isSupported;
  };


  const loadSavedCredentials = async () => {
    try {
      const saved = await SecureStore.getItemAsync(SECURE_AUTH_KEY);
      const biometricPref = await SecureStore.getItemAsync('use_biometric_pref');
      
      if (saved) {
        const { login: savedLogin, senha: savedSenha } = JSON.parse(saved);
        setLogin(savedLogin);
        setSenha(savedSenha);
        setHasSavedCredentials(true);
        
        if (biometricPref === 'true') {
          setUseBiometric(true);
          // Se biometria estiver ativa, dispara o prompt automaticamente após um pequeno delay
          setTimeout(() => {
            handleBiometricLogin(savedLogin, savedSenha);
          }, 500);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar credenciais', e);
    }
  };


  const saveCredentials = async (userLogin: string, userSenha: string) => {
    if (rememberPassword) {
      await SecureStore.setItemAsync(SECURE_AUTH_KEY, JSON.stringify({ login: userLogin, senha: userSenha }));
    } else {
      await SecureStore.deleteItemAsync(SECURE_AUTH_KEY);
    }
  };

  const handleBiometricLogin = async (savedLogin?: string, savedSenha?: string) => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse com sua Biometria',
      fallbackLabel: 'Usar Senha',
    });

    if (result.success) {
      // Se vier do auto-prompt, usamos as credenciais passadas
      if (savedLogin && savedSenha) {
        performLogin(savedLogin, savedSenha);
      } else {
        handleLogin();
      }
    }
  };

  const askToEnableBiometrics = () => {
    return new Promise<void>((resolve) => {
      if (isBiometricSupported && !useBiometric) {
        Alert.alert(
          'Ativar Biometria',
          'Deseja usar sua digital para entrar mais rápido nas próximas vezes?',
          [
            { 
              text: 'Agora não', 
              style: 'cancel',
              onPress: () => resolve() 
            },
            { 
              text: 'Sim, ativar', 
              onPress: async () => {
                const auth = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Confirme sua digital para ativar',
                });
                if (auth.success) {
                  await SecureStore.setItemAsync('use_biometric_pref', 'true');
                  setUseBiometric(true);
                  Alert.alert('Sucesso', 'Biometria ativada!');
                }
                resolve();
              } 
            }
          ]
        );
      } else {
        resolve();
      }
    });
  };




  const handleLogin = async () => {
    await performLogin(login, senha);
  };

  const performLogin = async (userLogin: string, userSenha: string) => {
    if (!userLogin || !userSenha) {
      Alert.alert('Atenção', 'Preencha usuário e senha ou utilize a biometria.');
      return;
    }

    setLoading(true);
    try {
      const response = await syncApi.post('/auth/login', { login: userLogin, senha: userSenha });
      const { token, user } = response.data;
      
      // Salva as credenciais básicas primeiro
      await saveCredentials(userLogin, userSenha);
      
      // Se suportar biometria e ainda não estiver ativa, pergunta ANTES de mudar de tela
      if (isBiometricSupported && !useBiometric) {
        await askToEnableBiometrics();
      }

      // SÓ AGORA avança para o Dashboard
      await setAuth(token, user);
    } catch (error: any) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.error?.message || 'Credenciais inválidas ou erro de conexão.';
      Alert.alert('Erro no Login', message);
    } finally {
      setLoading(false);
    }
  };






  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.iconBox}>
            <Clock size={36} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Ponto Fácil</Text>
          <Text style={styles.subtitle}>VERSÃO {Constants.expoConfig?.version}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <User size={14} color="#82737d" />
              <Text style={styles.label}>Usuário</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Seu login"
              placeholderTextColor="#b0a3aa"
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Lock size={14} color="#82737d" />
              <Text style={styles.label}>Senha</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#b0a3aa"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.rememberRow}>
            <View style={styles.rememberLeft}>
              <Switch
                value={rememberPassword}
                onValueChange={setRememberPassword}
                trackColor={{ false: "#eee5f0", true: "#631660" }}
                thumbColor="#FFFFFF"
              />
              <Text style={styles.rememberText}>Salvar Senha</Text>
            </View>
            
            {isBiometricSupported && hasSavedCredentials && (
              <TouchableOpacity onPress={() => handleBiometricLogin()} style={styles.bioIcon}>
                <Fingerprint size={28} color="#631660" />
              </TouchableOpacity>
            )}

          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <LogIn size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>ACESSAR SISTEMA</Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ff',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: normalize(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#eee5f0',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#631660',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    transform: [{ rotate: '3deg' }],
    shadowColor: '#631660',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: normalize(24),
    fontWeight: '900',
    color: '#1e1a22',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: normalize(10),
    fontWeight: 'bold',
    color: '#82737d',
    marginTop: 4,
    letterSpacing: 2,
  },
  form: {
    gap: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rememberText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: '#82737d',
  },
  bioIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fcf8fc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee5f0',
  },
  inputGroup: {
    gap: 8,
  },

  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: normalize(11),
    fontWeight: '900',
    color: '#82737d',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#fcf8fc',
    borderWidth: 1,
    borderColor: '#eee5f0',
    borderRadius: 16,
    padding: normalize(14),
    fontSize: normalize(15),
    fontWeight: '600',
    color: '#1e1a22',
  },
  button: {
    backgroundColor: '#631660',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#631660',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: normalize(13),
    letterSpacing: 1,
  }
});
