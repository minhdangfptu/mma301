import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import Checkbox from "expo-checkbox";
import COLORS from "../constants/colors";
import axios from "axios";
import emailjs from "emailjs-com"; // Import EmailJS

const API_URL = "https://mma301-project-be-9e9f.onrender.com";
const Signup = ({ navigation }) => {
  // State quản lý thông tin người dùng
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordShow, setIsPasswordShow] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // State quản lý OTP
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState(1); // Điều hướng giữa form đăng ký và OTP

  // Hàm tạo mã OTP ngẫu nhiên
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Hàm gửi OTP qua EmailJS
  const sendOtpEmail = async () => {
    if (!email || !phone || !password || !name) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      // Kiểm tra xem email đã tồn tại chưa
      const response = await axios.get(`${API_URL}/users`);
      const existingUser = response.data.data.find((user) => user.account.email === email);

      if (existingUser) {
        Alert.alert("Lỗi", "Email đã tồn tại. Vui lòng sử dụng email khác!");
        return;
      }

      // Tạo mã OTP và lưu vào state
      const otpCode = generateOtp();
      setGeneratedOtp(otpCode);

      // Gửi email OTP bằng EmailJS
      await emailjs.send(
        "service_c7gfj15", // Thay bằng Service ID của bạn
        "template_kiwvwgw", // Thay bằng Template ID của bạn
        {
          to_email: email,
          code: `Mã OTP của bạn là: ${otpCode}`,
        },
        "v6-07JXvMAmawKjFV" // Thay bằng Public Key của bạn
      );

      Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn.");
      setStep(2); // Chuyển sang bước nhập OTP
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      Alert.alert("Lỗi", "Không thể gửi email. Vui lòng thử lại.");
    }
  };

  // Hàm xác thực OTP
  const verifyOtp = () => {
    if (otp === generatedOtp) {
      Alert.alert("Thành công", "Xác thực OTP thành công!");
      handleSignup(); // Tiến hành đăng ký tài khoản sau khi xác thực OTP
    } else {
      Alert.alert("Lỗi", "OTP không chính xác, vui lòng thử lại!");
    }
  };

  // Hàm đăng ký tài khoản
  const handleSignup = async () => {
    if (!isChecked) {
      Alert.alert("Lỗi", "Bạn phải đồng ý với điều khoản!");
      return;
    }

    try {
      // Dữ liệu user mới
      const newUser = {
        id: `${Date.now()}`, // Tạo ID tạm thời
        userId: Math.floor(Math.random() * 10000), // ID ngẫu nhiên
        name,
        account: {
          email,
          password,
          activeCode: Math.random().toString(36).substring(7), // Mã kích hoạt ngẫu nhiên
          isActive: true,
        },
        address: {
          street: "Unknown",
          city: "Unknown",
          zipCode: 10000,
        },
      };

      // Gửi dữ liệu lên JSON Server
      await axios.post(`${API_URL}/users`, newUser);

      Alert.alert("Thành công", "Đăng ký thành công! Bạn có thể đăng nhập ngay.");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      Alert.alert("Lỗi", "Đăng ký thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ flex: 1, marginHorizontal: 22 }}>
        <View style={{ marginVertical: 22 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: COLORS.black }}>
            {step === 1 ? "Create Account" : "Verify OTP"}
          </Text>
        </View>

        {step === 1 ? (
          <>
            {/* Email */}
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
            {/* Số điện thoại */}
            <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
            {/* Họ và tên */}
            <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />
            {/* Mật khẩu */}
            <View style={styles.passwordContainer}>
              <TextInput placeholder="Password" secureTextEntry={!isPasswordShow} value={password} onChangeText={setPassword} style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setIsPasswordShow(!isPasswordShow)} style={{ padding: 10 }}>
                <Ionicons name={isPasswordShow ? "eye-off" : "eye"} size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>
            {/* Checkbox */}
            <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 6 }}>
              <Checkbox value={isChecked} onValueChange={setIsChecked} color={isChecked ? COLORS.info : undefined} />
              <Text style={{ marginLeft: 8 }}>I agree to the terms and conditions</Text>
            </View>
            {/* Nút gửi OTP */}
            <TouchableOpacity onPress={sendOtpEmail} style={styles.button}>
              <Text style={styles.buttonText}>Gửi mã OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Nhập OTP */}
            <TextInput placeholder="Nhập OTP" keyboardType="numeric" value={otp} onChangeText={setOtp} style={styles.input} />
            {/* Nút xác nhận OTP */}
            <TouchableOpacity onPress={verifyOtp} style={styles.button}>
              <Text style={styles.buttonText}>Xác nhận OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = {
  input: { width: "100%", borderColor: COLORS.primary, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, paddingLeft: 12 },
  button: { backgroundColor: COLORS.info, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 18 },
  buttonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
};

export default Signup;
