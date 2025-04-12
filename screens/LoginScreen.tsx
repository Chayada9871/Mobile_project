import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

import LoginButton from '../components/LoginButton';
import InputField from '../components/InputField';

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

export default function LoginScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single();

      if (error || !data) {
        Alert.alert('Login failed', 'Incorrect email or password.');
        return;
      }

      await AsyncStorage.setItem('userId', data.id.toString());

      Alert.alert('Login Success', 'Redirecting...');
      navigation.navigate('Home' as never);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome back!{"\n"}Glad to see you, Again!</Text>

      <InputField
        placeholder="Enter your email"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      <InputField
        placeholder="Enter your password"
        value={formData.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
      />

      <LoginButton onPress={handleSubmit}>
        Login
      </LoginButton>

      <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
        <Text style={styles.link}>Don't have an account? Register Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  link: { marginTop: 20, color: '#3b82f6', textAlign: 'center' },
});
