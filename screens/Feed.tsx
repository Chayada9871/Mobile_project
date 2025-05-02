import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList,
  Dimensions, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 10;

export default function Feed() {
  const [userId, setUserId] = useState<string | null>(null);
  const [followedUsersPosts, setFollowedUsersPosts] = useState<any[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      setUserId(storedId);

      if (storedId) {
        const userIntId = parseInt(storedId);

        // Fetch posts from users the current user follows
        const { data: follows, error: followError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userIntId);

        if (followError) {
          console.error('Error fetching follows:', followError.message);
          return;
        }

        const followedUserIds = follows.map((follow: any) => follow.following_id);

        // Fetch posts from the followed users
        const { data: posts, error: postError } = await supabase
          .from('posts')
          .select('*')
          .in('user_id', followedUserIds)
          .order('created_at', { ascending: false });

        if (posts) setFollowedUsersPosts(posts);
        if (postError) console.error('Error fetching posts:', postError.message);
      }
    };

    fetchData();
  }, []);

  const renderItem = ({ item }: any) => (
    <Image source={{ uri: item.image_url }} style={styles.image} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <Feather name="archive" size={24} color="white" />
      </View>

      {/* Posts Grid */}
      <FlatList
        data={followedUsersPosts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.imageGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNav]} onPress={() => navigation.navigate('Feed')}>
          <Ionicons name="home" size={24} color="#d14a1f" />
          <Text style={[styles.navText, { color: '#d14a1f' }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="camera" size={24} color="#444" />
          <Text style={styles.navText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Account')}>
          <Ionicons name="person" size={24} color="#444" />
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 80,
    backgroundColor: '#d14a1f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  imageGrid: { paddingHorizontal: 10 },
  image: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  bottomNav: {
    height: 70,
    borderTopWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 12, color: '#ccc' },
  activeNav: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
  },
});
