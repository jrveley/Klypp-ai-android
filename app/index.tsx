import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e' }}>
        <ActivityIndicator color="#c8f000" size="large" />
      </View>
    );
  }

  if (token) return <Redirect href="/(tabs)/dashboard" />;
  return <Redirect href="/(auth)/login" />;
}
