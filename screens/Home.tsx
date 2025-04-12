import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserId = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.navigate('Login' as never);
      } else {
        setUserId(storedId);
      }
    };

    fetchUserId();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    Alert.alert('Logged out', 'You have been logged out.');
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎉 Home Screen</Text>
      <Text style={styles.subtext}>Welcome, user ID:</Text>
      <Text style={styles.userId}>{userId}</Text>

      <Button title="Logout" onPress={handleLogout} color="#EF4444" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtext: { fontSize: 16, color: '#888' },
  userId: { fontSize: 18, marginVertical: 10, fontWeight: '600', color: '#222' }
});
