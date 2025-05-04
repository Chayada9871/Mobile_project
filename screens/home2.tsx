const [isUploadActive, setIsUploadActive] = useState(false); // New state to track upload button's active state

const handleUpload = () => {
  // Toggle the active state of the "Upload" button
  setIsUploadActive(!isUploadActive);
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

return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Profile</Text>
      <Feather name="archive" size={24} color="white" />
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
        style={[styles.navItem, !isHomeActive && styles.activeNav]}
        onPress={() => navigation.navigate('Feed')}
      >
        <Ionicons name="home" size={24} color="#444" />
        <Text style={styles.navText}>Feed</Text>
      </TouchableOpacity>

      {/* Centered Upload Button */}
      <View style={styles.uploadWrapper}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={handleUpload}
        >
          <Ionicons
            name="camera"
            size={24}
            color={isUploadActive ? '#d14a1f' : '#444'} // Change color based on isUploadActive
          />
          <Text
            style={[styles.navText, { color: isUploadActive ? '#d14a1f' : '#ccc' }]} // Change text color based on isUploadActive
          >
            Upload
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.navItem, isHomeActive && styles.activeNav]}
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
