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
import * as ImagePicker from 'expo-image-picker';
import 'react-native-url-polyfill/auto'; // To handle upload to Supabase

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 10;

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [fullName, setFullName] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      setUserId(storedId);

      if (storedId) {
        const userIntId = parseInt(storedId);

        const { data: posts, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userIntId)
          .order('created_at', { ascending: false });

        if (posts) setUserPhotos(posts);
        if (postError) console.error('Error fetching posts:', postError.message);

        const { data: userInfo, error: userError } = await supabase
          .from('users')
          .select('firstName, lastName, profile_url')
          .eq('id', userIntId)
          .single();

        if (userInfo) {
          setFullName(`${userInfo.firstName} ${userInfo.lastName}`);
          setProfileUrl(userInfo.profile_url || null);
        }
        if (userError) console.error('Error fetching user:', userError.message);

        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userIntId);

        const { count: followerCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userIntId);

        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userIntId);

        setStats({
          posts: postCount ?? 0,
          followers: followerCount ?? 0,
          following: followingCount ?? 0,
        });
      }
    };

    fetchData();
  }, []);

  const handleProfileImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.photo,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const image = result.assets[0];
      const fileExt = image.uri.split('.').pop();
      const fileName = `${userId}_profile.${fileExt}`;
      const filePath = `profile_pictures/${fileName}`;

      const response = await fetch(image.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        Alert.alert('Upload Error', uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_url: publicUrl })
        .eq('id', parseInt(userId!));

      if (updateError) {
        Alert.alert('Update Error', updateError.message);
      } else {
        setProfileUrl(publicUrl);
        Alert.alert('Success', 'Profile picture updated!');
      }
    }
  };

  const renderItem = ({ item }: any) => (
    <Image source={{ uri: item.image_url }} style={styles.image} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Feather name="archive" size={24} color="white" />
      </View>

      {/* Profile Picture + Name */}
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={handleProfileImagePick}>
          <Image
            source={
              profileUrl
                ? { uri: profileUrl }
                : require('../assets/default-avatar.png') // Default image if profile not set
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{fullName}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.posts}</Text>
          <Text style={styles.statLabel}>Post</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {/* Posts Grid */}
      <FlatList
        data={userPhotos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.imageGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#444" />
          <Text style={styles.navText}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="camera" size={24} color="#444" />
          <Text style={styles.navText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.activeNav]}>
          <Ionicons name="person" size={24} color="#d14a1f" />
          <Text style={[styles.navText, { color: '#d14a1f' }]}>Account</Text>
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
  profileContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#d14a1f',
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    color: '#222',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // padding: 16,
  },
  stat: { marginRight: 24, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#888' },
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
