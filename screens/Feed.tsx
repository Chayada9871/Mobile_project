import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, Alert, TextInput } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query state
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]); // List of users matching the search
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      setUserId(storedId);

      if (storedId) {
        const userIntId = parseInt(storedId);

        // Fetch list of users that the logged-in user is following
        const { data: follows, error: followError } = await supabase
          .from('follows')
          .select('followee_id')
          .eq('follower_id', userIntId);

        if (followError) {
          console.error('Error fetching follows:', followError.message);
          return;
        }

        // Extract followed user IDs
        const followedUserIds = follows.map((follow: any) => follow.followee_id);

        // Fetch posts of followed users
        const { data: posts, error: postError } = await supabase
          .from('posts')
          .select('*, users(firstName, lastName, profile_url, userName)') // Corrected: Join with users to get their info
          .in('user_id', followedUserIds)  // Filter posts by the followed users' IDs
          .order('created_at', { ascending: false });

        if (posts) {
          setFollowedUsersPosts(posts); // Set the posts from followed users
        }
        if (postError) {
          console.error('Error fetching posts:', postError.message);
        }
      }
    };

    fetchData();
  }, []);

  // Function to handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query) {
      // Correctly using .or() for multiple ilike() conditions
      const { data, error } = await supabase
  .from('users')
  .select('id, firstName, lastName, userName, profile_url')
  .ilike('userName', `%${query}%`) // Search by username
if (error) {
  console.error('Error searching users:', error.message);
  return;
}

setSearchedUsers(data); // Set the searched users

    } else {
      setSearchedUsers([]); // Clear the search results if the query is empty
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.postContainer}>
      {/* Post Owner Info */}
      <View style={styles.postOwner}>
        {/* Display profile image and name of the post owner */}
        {item.users && item.users.profile_url ? (
          <Image
            source={{ uri: item.users.profile_url }} // Safe access to profile_url
            style={styles.profileImage}
          />
        ) : (
          <Image
            source={require('../assets/default-avatar.png')} // Default image if profile_url is missing
            style={styles.profileImage}
          />
        )}
        <Text style={styles.userName}>
          {item.users ? `${item.users.userName}` : 'Unknown User'}
        </Text>
      </View>

      {/* Post Image */}
      <Image source={{ uri: item.image_url }} style={styles.image} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <Feather name="archive" size={24} color="white" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search profiles"
          value={searchQuery}
          onChangeText={handleSearch} // Update the search query on text change
        />
      </View>

      {/* Search Results */}
      <FlatList
        data={searchedUsers}
        renderItem={({ item }) => (
          <View style={styles.searchResult}>
            <Image
              source={{ uri: item.profile_url || '../assets/default-avatar.png' }}
              style={styles.profileImage}
            />
            <Text>{item.userName}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />

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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
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
  searchBar: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    fontSize: 16,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  imageGrid: { paddingHorizontal: 10 },
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
