import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import COLORS from "../constants/colors";
import Button from "../components/Button";
import PostTab from "./TabProfile/PostTab";
import FavoriteTab from "./TabProfile/FavoriteTab";
import TaggedTab from "./TabProfile/TaggedTab";
import { FontAwesome } from "@expo/vector-icons";
import { useAuth } from "../AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";

const API_URL = "https://mma301-project-be-9e9f.onrender.com/users";
const Tab = createMaterialTopTabNavigator();

function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();

  useEffect(() => {
    getUserId();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
        if (route.params?.refresh) {
            fetchUserData();  // Tải lại dữ liệu khi có refresh
        }
    }, [route.params])
);

  const getUserId = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      console.log("Stored user data:", storedUser); // Thêm log để kiểm tra dữ liệu
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Parsed user data:", parsedUser); // Thêm log để kiểm tra dữ liệu đã parse
        fetchUserData(parsedUser._id);
      } else {
        console.log("No user data found in AsyncStorage"); // Thêm log khi không tìm thấy dữ liệu
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error getting user ID:", error); // Thêm log chi tiết lỗi
      Alert.alert("Lỗi", "Không thể lấy ID người dùng.");
      setLoading(false);
    }
  };

  const fetchUserData = async (id) => {
    try {
      console.log("Fetching user data for ID:", id); // Thêm log ID đang fetch
      const response = await axios.get(`${API_URL}/${id}`);
      console.log("API Response:", response.data); // Thêm log response từ API
      
      // Check if response.data has a data property (like in Login.js)
      if (response.data && response.data.data) {
        setUser(response.data.data);
      } else {
        // If not, use response.data directly
        setUser(response.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error); // Thêm log chi tiết lỗi
      Alert.alert("Lỗi", "Không thể lấy thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Đã đăng xuất", "Bạn đã đăng xuất thành công!");
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng xuất.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: COLORS.white }}>Không tìm thấy thông tin người dùng</Text>
      </View>
    );
  }

  return (
    
    <LinearGradient
      style={{ flex: 1 }}
      colors={[COLORS.greenInfo, COLORS.info]}
    >
      <SafeAreaView style={styles.container}>
      <View style={{ alignItems: "center", marginBottom: 10 }}>
        <Image
          source={user?.avatar ? { uri: user.avatar } : require("../assets/p1.png")}
          style={{
            height: 100,
            width: 100,
            borderRadius: 50,
            marginBottom: 10,
          }}
        />
        <Text style={{ fontSize: 22, fontWeight: "bold", color: COLORS.white }}>
          {user?.name}
        </Text>
        <Text style={{ fontSize: 16, color: COLORS.white, opacity: 0.8 }}>
          {user?.account?.email}
        </Text>
      </View>

      <View
        style={{ backgroundColor: COLORS.white, padding: 20, borderRadius: 20 }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>
          Thông tin cá nhân
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.dark }}>
          📍 {user?.address?.street}, {user?.address?.city}
        </Text>
      </View>

      <View style={{ flex: 1, marginTop: 5 }}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color }) => {
              let iconName;
              if (route.name === "Posts") {
                iconName = "grid-on";
              } else if (route.name === "Favorite") {
                iconName = "favorite";
              } else if (route.name === "Tagged") {
                iconName = "person-outline";
              }
              return <Icon name={iconName} size={26} color={color} />;
            },
            tabBarShowLabel: false,
            tabBarStyle: { backgroundColor: "#fff" },
            tabBarActiveTintColor: "#000",
            tabBarInactiveTintColor: "#888",
          })}
        >
          <Tab.Screen name="Posts" component={PostTab} />
          <Tab.Screen name="Favorite" component={FavoriteTab} />
          <Tab.Screen name="Tagged" component={TaggedTab} />
        </Tab.Navigator>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom:50,
        }}
      >
        <Button
          title="Chỉnh sửa"
          style={{ marginTop: 12 }}
          onPress={() => navigation.navigate("ProfileEdit", { user })}
        />
        <Button
          title="Đăng xuất"
          onPress={handleLogout}
          color="red"
          style={{ marginTop: 12 }}
        />
      </View>
      <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Home")}>
                    <FontAwesome name="home" size={24} color="#8e8e8e" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("PostScreen")}>
                    <FontAwesome name="plus-square-o" size={24} color="#8e8e8e" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("MapScreen")}>
                    <FontAwesome name="map-o" size={24} color="#8e8e8e" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton}
                    onPress={() => navigation.navigate("ProfileStack")}>
                    <FontAwesome name="user-o" size={24} color="#262626" />
                </TouchableOpacity>
            </View>
            </SafeAreaView>
    </LinearGradient>
    
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      backgroundColor: "#45f7f4",
      paddingHorizontal: 20, 
      paddingTop: 20

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
  }
});