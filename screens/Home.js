import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, 
    ActivityIndicator, Alert, SafeAreaView, StatusBar, RefreshControl, Platform
} from "react-native";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { toggleFavorite, checkIsFavorite } from "../services/FavoriteService";
import { Ionicons } from "@expo/vector-icons";

const HomeScreen = () => {
    const route = useRoute();
    const [photos, setPhotos] = useState([]);
    const [search, setSearch] = useState("");
    const [favoritePhotos, setFavoritePhotos] = useState([]);
    const [likes, setLikes] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    const fetchPhotos = () => {
        setLoading(true);
        axios.get("https://mma301-project-be-9e9f.onrender.com/photos")
            .then(response => {
                if (response.data && response.data.data) {
                    setPhotos(response.data.data);
                } else {
                    console.log("Dữ liệu không đúng định dạng:", response.data);
                    setPhotos([]);
                }
            })
            .catch(err => {
                console.log("Error: " + err);
                setError("Không thể tải dữ liệu");
                setPhotos([]);
            })
            .finally(() => {
                setLoading(false);
                setRefreshing(false);
            });
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPhotos();
    };

    useEffect(() => {
        if (route.params?.refresh) {
            fetchPhotos();
            navigation.setParams({ refresh: false });
        }
    }, [route.params]);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const loadFavorites = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (!storedUser) {
                console.log("Không tìm thấy thông tin người dùng");
                return;
            }
            
            const parsedUser = JSON.parse(storedUser);
            const userId = parsedUser._id;
            
            if (photos && photos.length > 0) {
                const favoriteStatuses = await Promise.all(
                    photos.map(async (photo) => {
                        const favorite = await checkIsFavorite(photo._id, userId);
                        if (favorite) {
                            return { ...photo, isFavorite: true, favoriteId: favorite._id };
                        }
                        return { ...photo, isFavorite: false };
                    })
                );
                
                const favorites = favoriteStatuses.filter(photo => photo.isFavorite);
                setFavoritePhotos(favorites);
            }
        } catch (error) {
            console.log("Lỗi khi tải danh sách yêu thích:", error);
        }
    };

    const loadLikes = async () => {
        try {
            const savedLikes = await AsyncStorage.getItem("likes");
            if (savedLikes) {
                setLikes(JSON.parse(savedLikes));
            }
        } catch (error) {
            console.log("Lỗi khi tải lượt thích:", error);
        }
    };

    useEffect(() => {
        loadFavorites();
        loadLikes();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            if (photos.length > 0) {
                loadFavorites();
                loadLikes();
            }
        }, [photos])
    );

    const handleToggleFavorite = async (photo) => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (!storedUser) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để sử dụng tính năng này");
                return;
            }
            
            const parsedUser = JSON.parse(storedUser);
            const userId = parsedUser._id;
            
            const result = await toggleFavorite(photo._id, userId);
            
            let updatedLikes = { ...likes };
            
            if (result.isFavorite) {
                const newFavoritePhoto = {
                    ...photo,
                    isFavorite: true,
                    favoriteId: result.favorite._id
                };
                setFavoritePhotos([...favoritePhotos, newFavoritePhoto]);
                updatedLikes[photo._id] = (updatedLikes[photo._id] || 0) + 1;
            } else {
                const updatedFavorites = favoritePhotos.filter(fav => fav._id !== photo._id);
                setFavoritePhotos(updatedFavorites);
                updatedLikes[photo._id] = Math.max((updatedLikes[photo._id] || 0) - 1, 0);
            }
            
            setLikes(updatedLikes);
            await AsyncStorage.setItem("likes", JSON.stringify(updatedLikes));
            
            loadFavorites();
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái yêu thích:", error);
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại sau.");
        }
    };

    const renderItem = ({ item }) => {
        const isFavorite = favoritePhotos.some(fav => fav._id === item._id);
        
        return (
            <View style={styles.photoContainer}>
                {/* Header của bài đăng */}
                <View style={styles.postHeader}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                </View>
                
                {/* Ảnh */}
                <TouchableOpacity 
                    style={styles.imageWrapper}
                    onPress={() => navigation.navigate('PhotoDetails', { 
                        photo: { _id: item._id, title: item.title, image: item.image, userId: item.userId } 
                    })}>
                    <Image 
                        source={{ uri: item.image?.thumbnail }} 
                        style={styles.image} 
                        resizeMode="cover"
                    />
                </TouchableOpacity>
                
                {/* Action bar */}
                <View style={styles.infoContainer}>
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => handleToggleFavorite(item)}
                    >
                        <FontAwesome
                            name={isFavorite ? "heart" : "heart-o"}
                            size={24}
                            color="red"
                        />
                    </TouchableOpacity>
                    <Text style={styles.likeCount}>{likes[item._id] || 0} lượt thích</Text>
                    <Text style={styles.description}>{item.title}</Text>
                </View>
            </View>
        );
    };

    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchPhotos}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const filteredPhotos = photos.filter(photo => 
            search === "" || (photo.title && photo.title.toUpperCase().includes(search.toUpperCase()))
        );

        return (
            <FlatList
                data={filteredPhotos}
                keyExtractor={item => item._id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={["#007bff"]}
                        tintColor="#007bff"
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.notFound}>Không tìm thấy ảnh</Text>
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#45f7f4" />
            
            {/* Header */}
            <View style={styles.header}>
            <Text style={styles.appTitle}>Picly</Text>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.mapButton}
                    onPress={() => navigation.navigate("MapScreen")}
                >
                    <Ionicons name="map-outline" size={24} color="#007260" />
                </TouchableOpacity>
            </View>
            
            {/* Content */}
            {renderContent()}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navButton}>
                    <FontAwesome name="home" size={24} color="#262626" />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => navigation.navigate("PostScreen")}
                >
                    <FontAwesome name="plus-square-o" size={24} color="#8e8e8e" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navButton}
                    onPress={() => navigation.navigate("ProfileStack")}>
                    <FontAwesome name="user-o" size={24} color="#8e8e8e" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#45f7f4",
        paddingTop: 10
    },
    header: { 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between", 
        marginBottom: 10,
        paddingHorizontal: 10
    },
    appTitle: {
        fontSize: 50,
        // fontWeight: "bold",
        // color: "#007bff",
        marginRight: 10,
            fontWeight: "700",
            color: "#262626",
            fontStyle: "italic"
    },
    searchBox: { 
        flex: 1, 
        borderWidth: 1, 
        borderColor: "#ccc", 
        borderRadius: 8, 
        padding: 10, 
        fontSize: 16, 
        backgroundColor: "#fff" 
    },
    postButton: { 
        marginLeft: 10, 
        backgroundColor: "#007bff", 
        padding: 10, 
        borderRadius: 8 
    },
    photoContainer: { 
        marginBottom: 20, 
        backgroundColor: "#fff", 
        borderRadius: 10, 
        overflow: "hidden",
        marginHorizontal: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    postHeader: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0"
    },
    postTitle: {
        fontSize: 16,
        fontWeight: "bold"
    },
    imageWrapper: { 
        width: "100%", 
        height: 400 
    },
    image: { 
        width: "100%", 
        height: 400, 
        resizeMode: "cover" 
    },
    infoContainer: { 
        flexDirection: "column", 
        alignItems: "flex-start", 
        width: "100%", 
        padding: 10 
    },
    favoriteButton: { 
        marginBottom: 5 
    },
    likeCount: { 
        fontSize: 16, 
        fontWeight: "bold", 
        color: "black", 
        marginBottom: 5 
    },
    description: { 
        fontSize: 18, 
        fontWeight: "bold", 
        textAlign: "left" 
    },
    centerContainer: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center" 
    },
    loadingText: { 
        marginTop: 10, 
        fontSize: 16, 
        color: "#007bff" 
    },
    errorText: { 
        fontSize: 16, 
        color: "red", 
        textAlign: "center" 
    },
    notFound: { 
        textAlign: "center", 
        fontSize: 16, 
        color: "red", 
        marginVertical: 20 
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: "#007bff",
        borderRadius: 8
    },
    retryText: {
        color: "#fff",
        fontWeight: "600"
    },
    bottomNav: {
        flexDirection: "row",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        ...Platform.select({
            ios: {
                height: 80,
            },
            android: {
                height: 50,
            },
            default: {
              // other platforms, web for example
              height: 50,
            },
          }),
        backgroundColor: "#fff",
        borderTopWidth: 0.5,
        borderTopColor: "#dbdbdb",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 8
    },
    navButton: {
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                marginBottom: 40,
            },
          }),
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 10,
    },
    mapButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#f0f0f0",
    },
});