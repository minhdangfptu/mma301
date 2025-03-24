import React, { useEffect, useState } from "react";
import {
    View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getFavoritesByUserId, removeFavorite } from "../services/FavoriteService";

const FavouritePhotos = ({ route }) => {
    const [favoritePhotos, setFavoritePhotos] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigation = useNavigation();

    const loadFavorites = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (!storedUser) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để xem ảnh yêu thích");
                return;
            }
            
            const parsedUser = JSON.parse(storedUser);
            const userId = parsedUser._id;
            
            // Sử dụng service để lấy danh sách favorites từ API
            const userFavorites = await getFavoritesByUserId(userId);
            
            // Chuyển đổi dữ liệu để hiển thị
            const formattedData = userFavorites.map((favorite) => {
                const photo = favorite.photoId;
                return {
                    id: photo._id,
                    favoriteId: favorite._id,
                    image: photo.image,
                    title: photo.title,
                    userId: userId
                };
            });
            
            setFavoritePhotos(formattedData);
        } catch (error) {
            console.log("Lỗi khi tải danh sách yêu thích:", error);
            Alert.alert("Lỗi", "Không thể tải danh sách ảnh yêu thích. Vui lòng thử lại sau.");
        }
    };

    useEffect(() => {
        loadFavorites();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadFavorites();
        }, [])
    );

    const handleRemoveFavorite = async (item) => {
        try {
            // Sử dụng service để xóa favorite từ database
            await removeFavorite(item.favoriteId);
            
            // Cập nhật UI
            const updatedFavorites = favoritePhotos.filter(photo => photo.favoriteId !== item.favoriteId);
            setFavoritePhotos(updatedFavorites);
            
            // Giảm số lượt thích
            const savedLikes = await AsyncStorage.getItem("likes");
            let updatedLikes = savedLikes ? JSON.parse(savedLikes) : {};
            
            if (updatedLikes[item.id] && updatedLikes[item.id] > 0) {
                updatedLikes[item.id] -= 1;
            }
            
            await AsyncStorage.setItem("likes", JSON.stringify(updatedLikes));
            
            // Thông báo xóa thành công
            Alert.alert("Thành công", "Đã xóa ảnh khỏi danh sách yêu thích");
            
            // Truyền lại danh sách yêu thích mới và số lượt thích về HomeScreen
            if (route?.params?.updateFavorites) {
                route.params.updateFavorites(updatedFavorites);
            }
            if (route?.params?.updateLikes) {
                route.params.updateLikes(updatedLikes);
            }
        } catch (error) {
            console.error("Lỗi khi xóa ảnh yêu thích:", error);
            Alert.alert("Lỗi", "Không thể xóa ảnh khỏi danh sách yêu thích. Vui lòng thử lại sau.");
        }
    };

    const filteredPhotos = favoritePhotos.filter(photo =>
        photo.title && photo.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ảnh Yêu Thích</Text>

            {/* Tìm kiếm */}
            <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ảnh yêu thích..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredPhotos}
                keyExtractor={item => item.id.toString()}
                numColumns={2}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <TouchableOpacity onPress={() => navigation.navigate('PhotoDetails', { photo: { _id: item.id, title: item.title, image: item.image } })}>
                            <Image source={{ uri: item.image?.thumbnail || (item.image?.url && item.image.url[0]) }} style={styles.image} />
                        </TouchableOpacity>
                        <Text style={styles.photoTitle}>{item.title}</Text>
                        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFavorite(item)}>
                            <FontAwesome name="trash" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Không có ảnh yêu thích</Text>}
            />

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <FontAwesome name="arrow-left" size={20} color="white" />
                <Text style={styles.backButtonText}> Quay lại</Text>
            </TouchableOpacity>
        </View>
    );
};

export default FavouritePhotos;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: "#45f7f4", paddingVertical: 50 },
    title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
    searchInput: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingLeft: 10,
        marginBottom: 15,
        backgroundColor: "#fff"
    },
    card: { flex: 1, margin: 5, borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" },
    image: { width: "100%", height: 120, resizeMode: "cover" },
    photoTitle: { textAlign: "center", padding: 5, fontSize: 14, fontWeight: "500" },
    removeButton: {
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "#FF5733",
        padding: 5,
        borderRadius: 20
    },
    emptyText: { textAlign: "center", fontSize: 16, color: "red", marginTop: 20 },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF5733",
        padding: 10,
        borderRadius: 8,
        marginTop: 10
    },
    backButtonText: { color: "white", fontSize: 16, marginLeft: 5 }
});
