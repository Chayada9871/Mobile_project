import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

export default function Profile() {
  const route = useRoute();
  const { userId } = route.params;  // Get the userId from the route params
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('firstName, lastName, profile_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error.message);
        return;
      }

      setUserData(data);  // Set user data
    };

    fetchUserData();
  }, [userId]);

  if (!userData) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Image source={{ uri: userData.profile_url }} style={styles.profileImage} />
      <Text style={styles.userName}>{userData.firstName} {userData.lastName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  userName: { fontSize: 24, fontWeight: '600', marginTop: 10 },
});
