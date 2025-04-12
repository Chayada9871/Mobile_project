import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

// 🔧 Supabase client
const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

export default function SignupScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    email: '', password: '', firstName: '', lastName: '', phoneNumber: '',
  });

  const handleChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { email, password, firstName, lastName, phoneNumber } = userData;
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return Alert.alert('Missing info', 'Please fill in all fields.');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password, firstName, lastName, phoneNumber }])
        .select()
        .single();

      if (error || !data) {
        return Alert.alert('Signup Failed', error?.message || 'Try again.');
      }

      Alert.alert('Success', 'Account created!', [
        { text: 'OK', onPress: () => navigation.navigate('Login' as never) },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Unexpected error occurred.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Your Information for a{"\n"}Smooth Reservation Experience</Text>

        {['firstName', 'lastName', 'phoneNumber', 'email', 'password'].map((field, idx) => (
          <TextInput
            key={idx}
            placeholder={field === 'phoneNumber' ? 'Phone Number' : field === 'email' ? 'Email' : field === 'password' ? 'Password' : field.charAt(0).toUpperCase() + field.slice(1)}
            value={userData[field as keyof typeof userData]}
            onChangeText={(text) => handleChange(field, text)}
            secureTextEntry={field === 'password'}
            keyboardType={field === 'phoneNumber' ? 'phone-pad' : field === 'email' ? 'email-address' : 'default'}
            autoCapitalize={field === 'email' ? 'none' : 'words'}
            style={styles.input}
          />
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Get started</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center',
  },
  header: {
    fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'left', width: '100%',
  },
  input: {
    width: '100%', padding: 14, backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db', borderWidth: 1, borderRadius: 10, marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10,
    width: '100%', marginTop: 10, alignItems: 'center',
  },
  submitText: {
    color: '#fff', fontWeight: 'bold', fontSize: 16,
  },
  backButton: {
    position: 'absolute', top: 10, left: 4, zIndex: 10,
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
  },
  backIcon: {
    fontSize: 20, color: '#000',
  },
});
