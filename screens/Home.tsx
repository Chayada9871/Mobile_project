import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-url-polyfill/auto';

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 17;  // Adjusted for better fitting and spacing

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
  type RootStackParamList = {
    Feed: undefined;
    Home: undefined;
  };

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();

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
          .select('firstName, lastName, profile_url, userName')
          .eq('id', userIntId)
          .single();

        if (userInfo) {
          setFullName(`${userInfo.userName}`);
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
  const isHomeActive = route.name === 'Home';

  // Function to choose whether the user wants to take a photo or choose from media library
  const handleUpload = () => {
    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Take Photo',
          onPress: () => launchCamera(),
        },
        {
          text: 'Select from Library',
          onPress: async () => { const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1, }); },
        },
      ],
      { cancelable: true }
    );
  };

  // Function to launch the camera
  const launchCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera permission is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  // Function to launch the media library (gallery)
  const launchImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.photo,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  // Helper function to handle image upload
  const handleImageUpload = async (uri: string) => {
    const fileExt = uri.split('.').pop();
    const fileName = `${userId}_profile.${fileExt}`;
    const filePath = `profile_pictures/${fileName}`;

    const response = await fetch(uri);
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {/* <Feather name="archive" size={24} color="white" /> */}
      </View>

      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={handleProfileImagePick}>
          <Image
            source={
              profileUrl
                ? { uri: profileUrl }
                : require('../assets/default-avatar.png')
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{fullName}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.posts}</Text>
          <Text style={styles.statLabel}>Posts</Text>
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

      <FlatList
        data={userPhotos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.imageGrid}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, !isHomeActive ? null : {}]}
          onPress={() => navigation.navigate('Feed')}
        >
          <Ionicons name="home" size={24} color="#444" />
          <Text style={styles.navText}>Feed</Text>
        </TouchableOpacity>

        {/* Centered Upload Button */}
        <View style={styles.uploadWrapper}>
          <TouchableOpacity style={styles.navItem} onPress={handleUpload}>
            <Ionicons name="camera" size={24} color="#444" />
            <Text style={styles.navText}>Upload</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.navItem, isHomeActive ? {} : null]} // Fixed the missing bracket here
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="person" size={24} color={isHomeActive ? '#d14a1f' : '#444'} />
          <Text style={[styles.navText, { color: isHomeActive ? '#d14a1f' : '#ccc' }]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 100,
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
    justifyContent: 'center',  // Centering the stats horizontally
    alignItems: 'center',
    padding: 16,
  },
  stat: {
    alignItems: 'center',  // Centering each stat
    flex: 1,  // Allow each stat to take equal space in the row
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#888'
  },
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
      justifyContent: 'space-around', // Ensure space is distributed evenly
    alignItems: 'center',
    backgroundColor: '#000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
      paddingHorizontal: 10, // Adjust horizontal padding
  },
    navItem: { 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,  // This makes each nav item take up equal space
    },
  navText: { fontSize: 12, color: '#ccc' },
  // activeNav: {
  //   backgroundColor: '#fff',
  //   padding: 8,
  //   borderRadius: 20,
  // },
  uploadWrapper: {
    alignItems: 'center', // Center the Upload button
    flex: 1,  // This ensures the button takes available space and stays in the middle
    justifyContent: 'center', // Vertically center the Upload button in the navigation bar
  },
});
