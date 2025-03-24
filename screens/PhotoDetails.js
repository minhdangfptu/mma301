import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCommentsByPhotoId, createComment } from "../services/CommentService";
import { toggleFavorite, checkIsFavorite } from "../services/FavoriteService";
import { FontAwesome } from "@expo/vector-icons";
import { deletePhoto } from "../services/PhotoService";

const PhotoDetails = ({ route }) => {
  const navigation = useNavigation();
  const { photo } = route.params || {};
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadUser();
    loadComments();
  }, []);

  const checkFavoriteStatus = async () => {
    try {
      if (user?._id && photo?._id) {
        const favorite = await checkIsFavorite(photo._id, user._id);
        if (favorite) {
          setIsFavorite(true);
          setFavoriteId(favorite._id);
        } else {
          setIsFavorite(false);
          setFavoriteId(null);
        }
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  useEffect(() => {
    if (user && photo) {
      checkFavoriteStatus();
    }
  }, [user, photo]);

  const handleToggleFavorite = async () => {
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }

    try {
      const result = await toggleFavorite(photo._id, user._id);
      setIsFavorite(result.isFavorite);

      // Update likes in AsyncStorage
      const savedLikes = await AsyncStorage.getItem("likes");
      let updatedLikes = savedLikes ? JSON.parse(savedLikes) : {};
      
      if (result.isFavorite) {
        setFavoriteId(result.favorite._id);
        updatedLikes[photo._id] = (updatedLikes[photo._id] || 0) + 1;
      } else {
        setFavoriteId(null);
        updatedLikes[photo._id] = Math.max((updatedLikes[photo._id] || 0) - 1, 0);
      }

      await AsyncStorage.setItem("likes", JSON.stringify(updatedLikes));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại sau.");
    }
  };

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (photo?.userId?._id === parsedUser._id) {
          setIsOwner(true);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadComments = async () => {
    try {
      if (photo?._id) {
        const fetchedComments = await getCommentsByPhotoId(photo._id);
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      Alert.alert("Lỗi", "Không thể tải bình luận. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để bình luận");
      return;
    }
    if (!newComment.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung bình luận");
      return;
    }
    try {
      const comment = await createComment(photo._id, user._id, newComment);
      setComments([...comments, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
      Alert.alert("Lỗi", "Không thể đăng bình luận. Vui lòng thử lại sau.");
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.mainHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PhotoFORUM</Text>
          {isOwner && (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('PostScreen', { photo: photo })}
                style={{ marginRight: 10 }}
              >
                <Ionicons name="create-outline" size={24} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  Alert.alert(
                    'Xác nhận',
                    'Bạn có chắc chắn muốn xóa bài đăng này?',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { 
                        text: 'Xóa', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deletePhoto(photo._id);
                            navigation.navigate('Home', { refresh: true });
                          } catch (error) {
                            console.error('Error deleting photo:', error);
                            Alert.alert('Lỗi', 'Không thể xóa bài đăng. Vui lòng thử lại sau.');
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.header}>
          <Image
            source={photo?.userId?.avatar ? { uri: photo.userId.avatar } : require("../assets/p2.png")}
            style={styles.avatar}
          />
          <View style={styles.userTitle}>
            <Text style={styles.username}>{photo?.user?.name || photo?.userId?.name || "Người dùng"}</Text>
            <Text style={styles.time}>{photo?.createdAt ? new Date(photo.createdAt).toLocaleString() : ""}</Text>
          </View>
          <Ionicons
            name="ellipsis-horizontal"
            size={15}
            color="gray"
            style={{ bottom: 10 }}
          />
        </View>
        <View style={{ paddingLeft: 5 }}>
          <Text>{photo?.title || "Không có tiêu đề"}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
        >
          {photo?.image ? (
            Array.isArray(photo.image.url) ? (
              photo.image.url.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.image} />
              ))
            ) : photo.image.url ? (
              <Image
                source={{ uri: Array.isArray(photo.image.url) ? photo.image.url[0] : photo.image.url }}
                style={styles.image}
              />
            ) : photo.image.thumbnail ? (
              <Image
                source={{ uri: photo.image.thumbnail }}
                style={styles.image}
              />
            ) : (
              <Image source={require("../assets/p1.png")} style={styles.image} />
            )
          ) : (
            <Image source={require("../assets/p1.png")} style={styles.image} />
          )}
        </ScrollView>
        <View style={styles.reactions}>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <FontAwesome name={isFavorite ? "heart" : "heart-o"} size={24} color="red" />
          </TouchableOpacity>
          <Ionicons name="chatbubble-ellipses-outline" size={24} />
          {/* <Ionicons name="repeat-outline" size={24} />
          <Ionicons name="paper-plane-outline" size={24} /> */}
        </View>
        
        {photo?.location && photo.location.latitude && photo.location.longitude && (
          <View style={styles.mapContainer}>
            <Text style={styles.mapTitle}>Vị trí</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: parseFloat(photo.location.latitude),
                longitude: parseFloat(photo.location.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: parseFloat(photo.location.latitude),
                  longitude: parseFloat(photo.location.longitude),
                }}
              />
            </MapView>
          </View>
        )}
        
        <View style={styles.commentsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : comments.length === 0 ? (
            <Text style={styles.noComments}>Chưa có bình luận nào</Text>
          ) : (
            comments.map((comment, index) => (
              <View
                style={[styles.comment, index > 0 && styles.commentWithBorder]}
                key={index}
              >
                <View style={styles.userInfo}>
                  <Image
                    source={comment?.userId?.avatar ? { uri: comment.userId.avatar } : require("../assets/p2.png")}
                    style={styles.avatar}
                  />
                  <View style={styles.commentText}>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={styles.commentUser}>{comment.userId?.name || "Người dùng"}</Text>
                      <Text style={styles.time}>{new Date(comment.createdAt).toLocaleString()}</Text>
                    </View>
                    <View style={styles.commentContentContainer}>
                      <Text style={styles.commentContent}>{comment.text}</Text>
                    </View>
                    <View style={styles.reactions}>
                      <Ionicons name="heart-outline" size={20} />
                      <Ionicons name="chatbubble-ellipses-outline" size={20} />
                      {/* <Ionicons name="repeat-outline" size={20} />
                      <Ionicons name="paper-plane-outline" size={20} /> */}
                    </View>
                  </View>
                  <View style={{ bottom: 18 }}>
                    <Ionicons name="ellipsis-horizontal" size={15} color="gray" />
                  </View>
                </View>
              </View>
            )))}
        </View>

        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="Viết bình luận..."
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmitComment}>
            <Text style={styles.buttonText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    marginVertical: 10,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  map: {
    width: "100%",
    height: 200,
  },
  noComments: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginVertical: 20,
  },
  safeArea: {
    flex: 1,
  },
  container: { paddingLeft: 10, paddingRight: 10 },
  mainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 7,
    bottom: 10,
  },
  userTitle: {
    flex: 1,
    flexDirection: "row",
    marginBottom: 10,
    bottom: 6,
  },
  username: {
    fontWeight: "bold",
    fontSize: 15,
  },
  time: {
    color: "gray",
    fontSize: 13,
    paddingLeft: 7,
    alignItems: "center",
    top: 1,
  },
  imagesContainer: { marginBottom: 10, marginTop: 10 },
  image: { width: 230, height: 300, borderRadius: 15, marginRight: 10 },
  commentsContainer: {
    paddingTop: 10,
  },
  comment: {
    flexDirection: "column",
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2bbef9",
  },
  commentWithBorder: {
    paddingTop: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentText: {
    flex: 1,
  },
  commentUser: {
    fontWeight: "bold",
    fontSize: 15,
  },
  commentContent: {
    fontSize: 13,
  },
  reactions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "40%",
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#05fad1",
    borderRadius: 15,
    padding: 14,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#007260",
    padding: 10,
    borderRadius: 15,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default PhotoDetails;
