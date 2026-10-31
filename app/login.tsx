import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import AuthScreen, { authStyles } from '@/components/AuthScreen';
import FormField from '@/components/FormField';
import InlineMessage from '@/components/InlineMessage';
import { signIn } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to record your attendance and view your campus history."
      footer={
        <Link href="/register" style={authStyles.link}>
          New here? Create an account
        </Link>
      }
    >
      <View style={authStyles.form}>
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@school.edu"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          editable={!loading}
        />

        {error ? <InlineMessage tone="error" message={error} /> : null}

        <AppButton
          theme="primary"
          title={loading ? 'Signing in...' : 'Sign in'}
          icon="log-in-outline"
          onPress={handleLogin}
          disabled={loading}
        />
      </View>
    </AuthScreen>
  );
}
