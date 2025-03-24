"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import Checkbox from "expo-checkbox"
import axios from "axios"
import COLORS from "../constants/colors"
import { useAuth } from "../AuthContext"

const API_URL = "https://mma301-project-be-9e9f.onrender.com"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordShow, setIsPasswordShow] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`)
      const user = response.data.data.find((u) => u.account.email === email)

      if (!user) {
        Alert.alert("Lỗi", "Email không tồn tại!")
        return
      }

      if (!user.account.isActive) {
        Alert.alert("Lỗi", "Tài khoản chưa kích hoạt! Kiểm tra email để kích hoạt.")
        return
      }

      if (user.account.password !== password) {
        Alert.alert("Lỗi", "Mật khẩu không đúng!")
        return
      }

      await login(user)
      Alert.alert("Thành công", "Đăng nhập thành công!")
    } catch (error) {
      Alert.alert("Lỗi", "Không thể kết nối đến server.")
      console.error("Login error", error)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <View style={{ flex: 1, marginHorizontal: 22 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginVertical: 12, color: COLORS.black }}>
          Hey, Welcome back !
        </Text>
        <Text style={{ fontSize: 16, color: COLORS.black }}>Hello again you have been missed!</Text>

        <Text style={{ fontSize: 16, fontWeight: "600", marginVertical: 8 }}>Email address</Text>
        <TextInput
          placeholder="Enter your email address"
          placeholderTextColor={COLORS.grey}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{ width: "100%", borderColor: COLORS.primary, borderWidth: 1, borderRadius: 8, padding: 12 }}
        />

        <Text style={{ fontSize: 16, fontWeight: "600", marginVertical: 8 }}>Password</Text>
        <View
          style={{
            width: "100%",
            borderColor: COLORS.primary,
            borderWidth: 1,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: 12,
          }}
        >
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={COLORS.grey}
            secureTextEntry={!isPasswordShow}
            value={password}
            onChangeText={setPassword}
            style={{ flex: 1 }}
          />
          <TouchableOpacity onPress={() => setIsPasswordShow(!isPasswordShow)} style={{ padding: 10 }}>
            <Ionicons name={isPasswordShow ? "eye-off" : "eye"} size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 6 }}>
          <Checkbox
            style={{ marginRight: 8 }}
            value={isChecked}
            onValueChange={setIsChecked}
            color={isChecked ? COLORS.info : undefined}
          />
          <Text>Remember me</Text>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          style={{ backgroundColor: COLORS.info, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 18 }}
        >
          <Text style={{ color: COLORS.white, fontWeight: "bold", fontSize: 16 }}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default Login

