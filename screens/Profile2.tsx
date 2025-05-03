import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { createClient } from '@supabase/supabase-js';
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);

const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth / 3 - 10; // Grid layout for images

export default function Profile() {
  const route = useRoute();
  const { userId } = route.params as { userId: string }; // Retrieve the userId from the route params
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false); // Track follow state

  useEffect(() => {
    const fetchUserData = async () => {
      const loggedInUser = supabase.auth.user(); // Get the logged-in user

      // Check if user is logged in
      if (!loggedInUser) {
        Alert.alert('You need to be logged in to follow users.');
        return;
      }

      // Fetch user details based on the userId
      const { data, error } = await supabase
        .from('users')
        .select('id, firstName, lastName, userName, profile_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error.message);
      } else {
        setUser(data); // Set the user data
      }

      // Fetch posts for the user
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError.message);
      } else {
        setUserPosts(posts); // Set the user's posts
      }

      // Check if the logged-in user is following this user
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', loggedInUser.id) // Get logged-in user ID
        .eq('followee_id', userId) // Get target user ID
        .single();

      if (followError) {
        console.error('Error checking follow status:', followError.message);
      } else {
        setIsFollowing(!!followData); // Set the follow state based on the result
      }
    };

    fetchUserData();
  }, [userId]);

  const handleFollowUnfollow = async () => {
    const loggedInUser = supabase.auth.user(); // Get the logged-in user

    if (!loggedInUser) {
      Alert.alert('You need to be logged in to follow users.');
      return;
    }

    console.log('Logged in user ID:', loggedInUser.id); // Debugging log

    if (isFollowing) {
      // Unfollow the user
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', loggedInUser.id) // Get logged-in user ID
        .eq('followee_id', userId); // Get target user ID

      if (error) {
        console.error('Error unfollowing user:', error.message);
        Alert.alert('Error', 'Could not unfollow the user.');
      } else {
        setIsFollowing(false); // Update the follow state
        Alert.alert('Unfollowed', `You have unfollowed ${user.userName}`);
      }
    } else {
      // Follow the user
      const { error } = await supabase
        .from('follows')
        .insert([
          {
            follower_id: loggedInUser.id, // Get logged-in user ID
            followee_id: userId, // Get target user ID
          },
        ]);

      if (error) {
        console.error('Error following user:', error.message);
        Alert.alert('Error', 'Could not follow the user.');
      } else {
        setIsFollowing(true); // Update the follow state
        Alert.alert('Followed', `You are now following ${user.userName}`);
      }
    }
  };

  if (!user) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: user.profile_url || '../assets/default-avatar.png' }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{user.userName}</Text>
        <Text>{user.firstName} {user.lastName}</Text>

        {/* Follow/Unfollow Button */}
        <TouchableOpacity style={styles.followButton} onPress={handleFollowUnfollow}>
          <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>
      </View>

      {/* User's Posts Grid */}
      <FlatList
        data={userPosts}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <Image source={{ uri: item.image_url }} style={styles.postImage} />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.imageGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  followButton: {
    backgroundColor: '#d14a1f',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  postContainer: {
    marginBottom: 10,
  },
  postImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  imageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
