import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LogIn, Lock, User, Clock } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import syncApi from '../api/syncApi';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!login || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    setLoading(true);
    try {
      const response = await syncApi.post('/auth/login', { login, senha });
      const { token, user } = response.data;
      
      await setAuth(token, user);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao conectar no servidor. Verifique credenciais.';
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
          <Text style={styles.subtitle}>VIBE PREMIUM</Text>
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

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
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
    borderRadius: 32,
    padding: 32,
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
    fontSize: 28,
    fontWeight: '900',
    color: '#1e1a22',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#82737d',
    marginTop: 4,
    letterSpacing: 2,
  },
  form: {
    gap: 24,
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
    fontSize: 12,
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
    padding: 16,
    fontSize: 16,
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
    fontSize: 14,
    letterSpacing: 1,
  }
});
