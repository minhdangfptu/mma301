import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text, Image, ActivityIndicator, Alert, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";

const MapScreen = () => {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPhotosWithLocation();
  }, []);

  const fetchPhotosWithLocation = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://mma301-project-be-9e9f.onrender.com/photos");
      
      if (response.data && response.data.data) {
        // Lọc ra những ảnh có thông tin vị trí
        const photosWithLocation = response.data.data.filter(
          (photo) => photo.location && photo.location.latitude && photo.location.longitude
        );
        setPhotos(photosWithLocation);
      } else {
        console.log("Dữ liệu không đúng định dạng:", response.data);
        setPhotos([]);
      }
    } catch (err) {
      console.log("Error: " + err);
      setError("Không thể tải dữ liệu");
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={{
          latitude: 16.0285, // Vị trí mặc định (Hà Nội)
          longitude: 106.8542,
          latitudeDelta: 10.0,
          longitudeDelta: 10.0,
        }}
      >
        {photos.map((photo, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(photo.location.latitude),
              longitude: parseFloat(photo.location.longitude),
            }}
            onPress={() => navigation.navigate("PhotoDetails", { photo })}
          >
            <Image 
              source={{ uri: photo.image?.thumbnail || (photo.image?.url && (Array.isArray(photo.image.url) ? photo.image.url[0] : photo.image.url)) }} 
              style={styles.markerImage} 
            />
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity 
        style={styles.listButton} 
        onPress={() => navigation.navigate("ProfileStack")}
      >
        <Text style={styles.buttonText}>Xem danh sách ảnh</Text>
      </TouchableOpacity>
      <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navButton}
                onPress={() => navigation.navigate("Home")}>
                    <FontAwesome name="home" size={24} color="#8e8e8e" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  listButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "#007260",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
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

export default MapScreen;