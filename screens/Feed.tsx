import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-url-polyfill/auto';

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / numColumns - 10;

export default function Feed() {
  const [userId, setUserId] = useState<string | null>(null);
  const [followedUsersPosts, setFollowedUsersPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query state
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]); // List of users matching the search
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
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
        .ilike('userName', `%${query}%`);  // Search by username
      if (error) {
        console.error('Error searching users:', error.message);
        return;
      }

      setSearchedUsers(data); // Set the searched users

    } else {
      setSearchedUsers([]); // Clear the search results if the query is empty
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      // Upload the image to Supabase Storage as a post image
      const fileExt = uri.split('.').pop(); // Extract the file extension
      const fileName = `post_${Date.now()}.${fileExt}`;
      const response = await fetch(uri);
      const blob = await response.blob();
  
      const { data, error } = await supabase
        .storage
        .from('images') // This is your Supabase storage bucket
        .upload(fileName, blob, {
          contentType: 'image/jpeg', // Change content type as needed (e.g., image/png)
        });
  
      if (error) {
        console.error("Error uploading image:", error);
        return;
      }
  
      // Get the public URL of the uploaded image
      const imageUrl = `${supabase.storageUrl}/images/${data.path}`;
  
      // Now, insert the image URL into the 'posts' table as a new post
      const userIntId = parseInt(await AsyncStorage.getItem('userId'));
  
      const { data: postData, postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: userIntId,
            image_url: imageUrl, // Image URL from Supabase Storage
            caption: 'User uploaded a new post', // You can add a custom caption here
          },
        ]);
  
      if (postError) {
        console.error("Error posting the image:", postError);
        return;
      }
  
      console.log("Image successfully uploaded and post created", postData);
  
      // Optionally, you can update the user's profile picture in the 'users' table (if needed)
      const { data: userData, userError } = await supabase
        .from('users')
        .update({ profile_url: imageUrl })
        .eq('id', userIntId);
  
      if (userError) {
        console.error("Error updating user profile:", userError);
        return;
      }
  
      console.log("Profile picture updated successfully", userData);
      setProfileUrl(imageUrl); // Update the profile URL in the state to reflect the new image

    } catch (error) {
      console.error("Error in image upload:", error);
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
          onPress: () => launchImageLibrary(),
        },
      ],
      { cancelable: true }
    );
  };

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

  const launchImageLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Media Library permission is required to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      handleImageUpload(result.assets[0].uri);
    }
  };

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
  renderItem={({ item }) => {
    console.log("Profile URL:", item.profile_url); // Log to check the value of profile_url
    return (
      <TouchableOpacity
        style={styles.searchResult}
      onPress={() => navigation.navigate("Profile", { userId: item.id })} // Navigate to the profile when clicked
      >
        <Image
        source={{ uri: item.profile_url || require('../assets/default-avatar.png') }} // Default image if profile_url is missing
          style={styles.profileImage}
        />
   

        <Text>{item.userName}</Text>
      </TouchableOpacity>
    );
  }}
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
        <TouchableOpacity style={styles.navItem} onPress={handleUpload}>
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
});
