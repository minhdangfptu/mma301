import React, { useState, useRef } from "react";
import * as Location from "expo-location";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Animated,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Switch
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const PostScreen = () => {
    const [title, setTitle] = useState("");
    const [images, setImages] = useState([]);
    const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [includeLocation, setIncludeLocation] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Animate the placeholder when no images are selected
    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Quyền truy cập bị từ chối", 
                "Cần cấp quyền truy cập thư viện ảnh để tiếp tục", 
                [{ text: "Đã hiểu" }]);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 10,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...newImages]);
            if (images.length === 0) setSelectedThumbnailIndex(0);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Quyền truy cập bị từ chối", 
                "Cần cấp quyền truy cập camera để tiếp tục", 
                [{ text: "Đã hiểu" }]);
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets.map(asset => asset.uri)]);
            if (images.length === 0) setSelectedThumbnailIndex(0);
        }
    };

    const handlePost = async () => {
        if (!title.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề cho bài viết", [{ text: "Đã hiểu" }]);
            return;
        }
    
        if (images.length === 0) {
            Alert.alert("Thiếu thông tin", "Vui lòng chọn ít nhất một ảnh cho bài viết", [{ text: "Đã hiểu" }]);
            return;
        }
    
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem("user");
    
            if (!storedUser) {
                Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để đăng bài", [{ text: "Đã hiểu" }]);
                setLoading(false);
                return;
            }
    
            const parsedUser = JSON.parse(storedUser);
    
            // Get location if enabled
            let locationData = null;
            if (includeLocation) {
                try {
                    if (!currentLocation) {
                        const { status } = await Location.requestForegroundPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert("Quyền truy cập bị từ chối", "Cần cấp quyền truy cập vị trí để tiếp tục", [{ text: "Đã hiểu" }]);
                            setIncludeLocation(false);
                        } else {
                            const location = await Location.getCurrentPositionAsync({});
                            setCurrentLocation(location.coords);
                            locationData = {
                                latitude: location.coords.latitude.toString(),
                                longitude: location.coords.longitude.toString()
                            };
                        }
                    } else {
                        locationData = {
                            latitude: currentLocation.latitude.toString(),
                            longitude: currentLocation.longitude.toString()
                        };
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy vị trí:", error);
                    Alert.alert("Lỗi vị trí", "Không thể lấy vị trí hiện tại", [{ text: "Đã hiểu" }]);
                    setIncludeLocation(false);
                }
            }
    
            // Show progress updates
            let completedUploads = 0;
            
            // Prepare Cloudinary upload data
            const uploadPromises = images.map(async (uri, index) => {
                const cloudinaryData = new FormData();
                cloudinaryData.append("file", {
                    uri: uri,
                    name: `upload_${index}.jpg`,
                    type: 'image/jpeg'
                });
                cloudinaryData.append("upload_preset", "MMA_Upload");
                cloudinaryData.append("cloud_name", "dvdnw79tk");
    
                const response = await fetch(
                    "https://api.cloudinary.com/v1_1/dvdnw79tk/image/upload",
                    {
                        method: "POST",
                        body: cloudinaryData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    }
                );
    
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Tải ảnh lên thất bại: ${errorData.error?.message || 'Lỗi không xác định'}`);
                }
                
                // Update progress
                completedUploads++;
                setUploadProgress((completedUploads / images.length) * 100);
                
                return response.json();
            });
    
            const cloudinaryResults = await Promise.all(uploadPromises);
        
        // Extract URLs correctly
        const imageUrls = cloudinaryResults.map(result => result.secure_url);
        const thumbnailUrl = imageUrls[selectedThumbnailIndex];
        
        // Send all images in a single request
        const postData = {
            title: title,
            userId: parsedUser._id,
            image: {
                url: imageUrls, // Send the array of URLs
                thumbnail: thumbnailUrl
            }
        };
        
        // Add location data if available
        if (locationData) {
            postData.location = locationData;
        }
        
        const response = await axios.post(
            "https://mma301-project-be-9e9f.onrender.com/photos",
            postData,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${parsedUser.token}`
                }
            }
        );
        
        Alert.alert(
            "Đăng bài thành công", 
            "Bài viết của bạn đã được đăng thành công!",
            [{ text: "OK", onPress: () => navigation.navigate('Home', { refresh: true }) }]
        );
        } catch (error) {
            console.error("Lỗi khi đăng bài:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
    
            const errorMessage = error.response?.data?.error || error.response?.data?.message
                || `Mã lỗi: ${error.response?.status || 'Không xác định'}`
                || "Không thể đăng bài. Vui lòng thử lại sau.";
    
            Alert.alert("Đăng bài thất bại", errorMessage, [{ text: "Đã hiểu" }]);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const renderImageItem = ({ item, index }) => (
        <View style={styles.imageItem}>
            <Image source={{ uri: item }} style={styles.selectedImage} />
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                    setImages(prev => prev.filter((_, i) => i !== index));
                    if (selectedThumbnailIndex === index) {
                        setSelectedThumbnailIndex(0);
                    } else if (selectedThumbnailIndex > index) {
                        setSelectedThumbnailIndex(prev => prev - 1);
                    }
                }}>
                <Ionicons name="close-circle" size={26} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.thumbnailSelector,
                    selectedThumbnailIndex === index && styles.thumbnailSelectorActive
                ]}
                onPress={() => setSelectedThumbnailIndex(index)}>
                {selectedThumbnailIndex === index ? (
                    <MaterialIcons name="check-circle" size={26} color="#34C759" />
                ) : (
                    <MaterialIcons name="radio-button-unchecked" size={26} color="#8E8E93" />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => {
                            if (images.length > 0 || title.trim()) {
                                Alert.alert(
                                    "Hủy bỏ bài viết?",
                                    "Nếu bạn rời đi, bài viết sẽ không được lưu.",
                                    [
                                        { text: "Tiếp tục chỉnh sửa", style: "cancel" },
                                        { text: "Hủy bỏ", style: "destructive", onPress: () => navigation.goBack() }
                                    ]
                                );
                            } else {
                                navigation.goBack();
                            }
                        }}>
                        <Ionicons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tạo bài viết mới</Text>
                    <TouchableOpacity
                        style={[
                            styles.postButton, 
                            (!title.trim() || images.length === 0) && styles.disabledButton
                        ]}
                        onPress={handlePost}
                        disabled={!title.trim() || images.length === 0 || loading}
                    >
                        <Text style={styles.postButtonText}>Đăng</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.titleContainer}>
                        <TextInput
                            style={styles.titleInput}
                            placeholder="Nhập tiêu đề bài viết..."
                            placeholderTextColor="#8E8E93"
                            value={title}
                            onChangeText={setTitle}
                            multiline
                            maxLength={200}
                        />
                        <Text style={styles.charCount}>{title.length}/200</Text>
                    </View>

                    <View style={styles.sectionTitle}>
                        <MaterialIcons name="photo-library" size={22} color="#007AFF" />
                        <Text style={styles.sectionTitleText}>Ảnh bài viết</Text>
                        <Text style={styles.imageCount}>{images.length > 0 ? `${images.length} ảnh` : ""}</Text>
                    </View>

                    {images.length > 0 ? (
                        <View style={styles.imageListContainer}>
                            <FlatList
                                horizontal
                                data={images}
                                renderItem={renderImageItem}
                                keyExtractor={(item, index) => index.toString()}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.imageList}
                            />
                            <View style={styles.thumbnailHelp}>
                                <MaterialIcons name="info-outline" size={16} color="#8E8E93" />
                                <Text style={styles.thumbnailHelpText}>
                                    Chọn ảnh đại diện cho bài viết bằng cách nhấn vào biểu tượng tròn
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Animated.View 
                            style={[
                                styles.imagePlaceholder,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <MaterialIcons name="add-photo-alternate" size={60} color="#C7C7CC" />
                            <Text style={styles.imagePlaceholderText}>
                                Thêm ảnh cho bài viết của bạn
                            </Text>
                        </Animated.View>
                    )}

                    <View style={styles.locationContainer}>
                        <View style={styles.sectionTitle}>
                            <MaterialIcons name="location-on" size={22} color="#007AFF" />
                            <Text style={styles.sectionTitleText}>Vị trí</Text>
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>
                                {includeLocation ? "Đăng kèm vị trí" : "Không đăng kèm vị trí"}
                            </Text>
                            <Switch
                                trackColor={{ false: "#E5E5EA", true: "#4CD964" }}
                                thumbColor={includeLocation ? "#fff" : "#fff"}
                                ios_backgroundColor="#E5E5EA"
                                onValueChange={async (value) => {
                                    setIncludeLocation(value);
                                    if (value && !currentLocation) {
                                        const { status } = await Location.requestForegroundPermissionsAsync();
                                        if (status !== 'granted') {
                                            Alert.alert("Quyền truy cập bị từ chối", 
                                                "Cần cấp quyền truy cập vị trí để tiếp tục", 
                                                [{ text: "Đã hiểu" }]);
                                            setIncludeLocation(false);
                                            return;
                                        }
                                        try {
                                            const location = await Location.getCurrentPositionAsync({});
                                            setCurrentLocation(location.coords);
                                        } catch (error) {
                                            console.error("Lỗi khi lấy vị trí:", error);
                                            Alert.alert("Lỗi vị trí", "Không thể lấy vị trí hiện tại", [{ text: "Đã hiểu" }]);
                                            setIncludeLocation(false);
                                        }
                                    }
                                }}
                                value={includeLocation}
                            />
                        </View>
                        {includeLocation && currentLocation && (
                            <Text style={styles.locationText}>
                                Vị trí hiện tại: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                            </Text>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.galleryButton]} 
                            onPress={pickImage}
                        >
                            <Ionicons name="images-outline" size={22} color="#fff" />
                            <Text style={styles.actionButtonText}>Thư viện</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.cameraButton]} 
                            onPress={takePhoto}
                        >
                            <Ionicons name="camera-outline" size={22} color="#fff" />
                            <Text style={styles.actionButtonText}>Chụp ảnh</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <View style={styles.loadingCard}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>
                                {uploadProgress < 100 
                                    ? `Đang tải ảnh lên (${Math.round(uploadProgress)}%)` 
                                    : "Đang đăng bài..."}
                            </Text>
                            <View style={styles.progressBarContainer}>
                                <View 
                                    style={[
                                        styles.progressBar, 
                                        { width: `${uploadProgress}%` }
                                    ]} 
                                />
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
        backgroundColor: "#fff",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
    },
    postButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    disabledButton: {
        backgroundColor: "#C7C7CC",
    },
    postButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    titleContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    titleInput: {
        fontSize: 18,
        color: "#000",
        minHeight: 100,
        textAlignVertical: "top",
        padding: 0,
    },
    charCount: {
        fontSize: 12,
        color: "#8E8E93",
        textAlign: "right",
        marginTop: 8,
    },
    sectionTitle: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionTitleText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
        color: "#000",
    },
    imageCount: {
        fontSize: 14,
        color: "#8E8E93",
        marginLeft: "auto",
    },
    imageListContainer: {
        marginBottom: 16,
    },
    imageList: {
        paddingHorizontal: 16,
    },
    imageItem: {
        position: 'relative',
        marginRight: 12,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E5EA",
    },
    selectedImage: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: 12,
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 15,
        padding: 2,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    thumbnailSelector: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 15,
        padding: 2,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    thumbnailSelectorActive: {
        backgroundColor: 'rgba(255,255,255,1)',
    },
    thumbnailHelp: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 8,
    },
    thumbnailHelpText: {
        fontSize: 12,
        color: "#8E8E93",
        marginLeft: 4,
    },
    imagePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F2F2F7",
        borderRadius: 12,
        marginHorizontal: 16,
        height: width * 0.5,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        borderStyle: "dashed",
    },
    imagePlaceholderText: {
        marginTop: 12,
        fontSize: 16,
        color: "#8E8E93",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
        paddingHorizontal: 16,
        gap: 16,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        flex: 1,
    },
    galleryButton: {
        backgroundColor: "#5856D6",
    },
    cameraButton: {
        backgroundColor: "#FF9500",
    },
    actionButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
        marginLeft: 8,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    loadingCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        width: "80%",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#000",
        textAlign: "center",
    },
    progressBarContainer: {
        width: "100%",
        height: 6,
        backgroundColor: "#E5E5EA",
        borderRadius: 3,
        marginTop: 16,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#34C759",
    },
});

export default PostScreen;