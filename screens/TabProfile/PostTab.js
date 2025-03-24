import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";

const { width } = Dimensions.get("window");
const imageSize = (width - 8) / 3; // 3 images per row with minimal padding

const PostTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Use useFocusEffect to refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserPhotos();
    }, [])
  );

  const fetchUserPhotos = async () => {
    try {
      setError(null);
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        throw new Error("No user logged in");
      }

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser._id;
      const response = await axios.get(
        `https://mma301-project-be-9e9f.onrender.com/photos?userId=${userId}`
      );
      const photos = response.data.data;
      
      const formattedData = photos.map((photo) => {
        // Handle the case where image.url might be a string or an array
        let urls = photo.image.url;
        if (typeof urls === 'string') {
          // If it's a comma-separated string, split it into an array
          urls = urls.split(',');
        }
        
        return {
          id: photo._id || photo.id,
          title: photo.title,
          userId: photo.userId,
          uri: photo.image.thumbnail || (urls && urls.length > 0 ? urls[0] : null),
          allImages: urls || [],
        };
      });

      setData(formattedData);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setError("Không thể tải ảnh. Vui lòng thử lại sau.");
      Alert.alert("Lỗi", "Không thể tải ảnh. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserPhotos();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.imageContainer}
      onPress={() => navigation.navigate('PhotoDetails', { 
        photo: { 
          _id: item.id, 
          title: item.title, 
          userId: item.userId,
          image: { 
            thumbnail: item.uri, 
            url: item.allImages 
          } 
        }
      })}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.image}
        onError={(e) => console.log("Image failed to load:", item.uri)}
      />
      {item.allImages && item.allImages.length > 1 && (
        <View style={styles.multipleIndicator}>
          <Text style={styles.multipleIndicatorText}>{item.allImages.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Bạn chưa có bài viết nào</Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('PostScreen')}
      >
        <Text style={styles.createButtonText}>Tạo bài viết mới</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserPhotos}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  listContent: {
    padding: 2,
    flexGrow: 1,
  },
  imageContainer: {
    margin: 1,
    position: 'relative',
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 2,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multipleIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default PostTab;
