import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';

const API_URL = 'https://mma301-project-be-9e9f.onrender.com/users';

const cities = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh', 'Bến Tre',
  'Bình Dương', 'Bình Định', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng',
  'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam',
  'Hà Nội', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hồ Chí Minh', 'Hưng Yên',
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An',
  'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam',
  'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc',
  'Yên Bái'
];

function ProfileEdit({ route, navigation }) {
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.avatar || "");

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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri) => {
    setAvatarLoading(true);
    try {
      // Tạo form data để upload lên Cloudinary
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", {
        uri: uri,
        name: `avatar_${user._id}.jpg`,
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
      
      const data = await response.json();
      const imageUrl = data.secure_url;
      
      // Cập nhật state
      setAvatarUrl(imageUrl);
      setUser(prev => ({ ...prev, avatar: imageUrl }));
      
      Alert.alert("Thành công", "Đã cập nhật ảnh đại diện");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/${user._id}`, user);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
      // navigation.navigate('ProfileScreen', { refresh: true });
      navigation.goBack();

    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container}>
        {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        {avatarLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.avatar} />
        ) : (
          <Image 
            source={avatarUrl ? { uri: avatarUrl } : require('../assets/p1.png')} 
            style={styles.avatar} 
          />
        )}
        
        <View style={styles.avatarButtons}>
          <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
            <FontAwesome name="image" size={20} color="#fff" />
            <Text style={styles.buttonText}>Thư viện</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.avatarButton} onPress={takePhoto}>
            <FontAwesome name="camera" size={20} color="#fff" />
            <Text style={styles.buttonText}>Chụp ảnh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <Text style={styles.label}>Tên:</Text>
      <TextInput
        value={user?.name}
        onChangeText={(text) => setUser({ ...user, name: text })}
        style={styles.input}
      />

      <Text style={styles.label}>Đường:</Text>
      <TextInput
        value={user?.address?.street}
        onChangeText={(text) => setUser({ ...user, address: { ...user.address, street: text } })}
        style={styles.input}
      />

      <Text style={styles.label}>Thành phố:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={user?.address?.city}
          onValueChange={(value) => setUser({ ...user, address: { ...user.address, city: value } })}
          style={styles.picker}
          mode="dropdown"
          dropdownIconColor="#333"
          dropdownIconRippleColor="#eee"
          itemStyle={{ fontSize: 16, color: '#333', height: 120 }}
          modalProps={{
            animationType: 'slide',
            transparent: true,
            presentationStyle: 'pageSheet',
            statusBarTranslucent: true
          }}
        >
          <Picker.Item label="Chọn thành phố..." value="" style={{ color: '#666' }} />
          {cities.map(city => (
            <Picker.Item key={city} label={city} value={city} style={{ color: '#333' }} />
          ))}
        </Picker>
      </View>

        {loading ? (
          <ActivityIndicator size="large" color="green" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Cập nhật thông tin</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff'
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10
  },
  avatarButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },
  avatarButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
    paddingHorizontal: 10,
    backgroundColor: 'transparent'
  },
  pickerItem: {
    fontSize: 16,
    paddingVertical: 8,
    marginHorizontal: -10,
    textOverflow: 'ellipsis',
    numberOfLines: 1,
    paddingRight: 15
  },
  updateButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loader: {
    marginTop: 20
  }
});

export default ProfileEdit;