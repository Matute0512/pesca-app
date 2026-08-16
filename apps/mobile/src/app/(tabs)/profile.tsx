import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, status, login, register, logout } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated' && user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>👤 {user.fullName ?? user.username ?? user.email}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>Rol: {user.role}</Text>

        <Pressable style={styles.primary} onPress={() => router.push('/suggest')}>
          <Text style={styles.primaryText}>🎣 {t('suggest.title')}</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => void logout()}>
          <Text style={styles.secondaryText}>{t('profile.logout')}</Text>
        </Pressable>
      </View>
    );
  }

  async function submit() {
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, username || email.split('@')[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.notLogged')}</Text>

      <View style={styles.modeRow}>
        {(['login', 'register'] as const).map((m) => (
          <Pressable key={m} style={[styles.modeBtn, mode === m && styles.modeBtnActive]} onPress={() => setMode(m)}>
            <Text style={mode === m ? styles.modeTextActive : undefined}>
              {m === 'login' ? t('profile.login') : t('profile.register')}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput style={styles.input} placeholder={t('profile.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      {mode === 'register' && (
        <TextInput style={styles.input} placeholder={t('profile.username')} value={username} onChangeText={setUsername} autoCapitalize="none" />
      )}
      <TextInput style={styles.input} placeholder={t('profile.password')} value={password} onChangeText={setPassword} secureTextEntry />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.primary} onPress={() => void submit()}>
        <Text style={styles.primaryText}>
          {mode === 'login' ? t('profile.login') : t('profile.register')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  meta: { color: '#6b7480' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e6ec',
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e6ec' },
  modeBtnActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  modeTextActive: { color: '#fff', fontWeight: '600' },
  primary: { backgroundColor: '#0f766e', padding: 14, borderRadius: 10, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { padding: 12, alignItems: 'center' },
  secondaryText: { color: '#b91c1c', fontWeight: '600' },
  error: { color: '#b91c1c' },
});
