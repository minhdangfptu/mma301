import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import axios from "axios";
import emailjs from "@emailjs/browser"; 
import { useNavigation } from "@react-navigation/native"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [userId, setUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation();

  const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

const handleSubmit = async () => {
    setError("");
    setSuccess("");

    try {
        console.log("Đang gửi yêu cầu GET đến API...");
        const response = await axios.get("https://mma-json-deploy.onrender.com/users", {
            timeout: 10000, // Thêm timeout 10 giây để tránh treo app
        });

        console.log("Phản hồi API:", response.data);

        if (!response.data || !Array.isArray(response.data)) {
            throw new Error("Dữ liệu từ API không hợp lệ.");
        }

        const users = response.data;
        const user = users.find((u) => u.account && u.account.email === email);

        if (!user) {
            setError("Email không tồn tại trong hệ thống.");
            return;
        }

        setUserId(user.id);
        const code = generateResetCode();
        setGeneratedCode(code);

        try {
            await sendResetCodeEmail(email, code);
            setSuccess("Mã xác thực đã được gửi đến email của bạn.");
            setShowCodeInput(true);
        } catch (emailError) {
            console.error("Lỗi khi gửi email:", emailError);
            setError("Không thể gửi email. Vui lòng thử lại.");
        }
    } catch (error) {
        console.error("Lỗi trong handleSubmit:", error.response?.data || error.message);
        setError("Lỗi hệ thống. Vui lòng thử lại sau.");
    }
};



  const sendResetCodeEmail = async (email, resetCode) => {
    try {
      console.log("Sending email with information:", { email, resetCode });
      const response = await emailjs.send(
        "service_6zpmtln", // Service ID từ EmailJS
        "template_ya8jkdt", // Template ID từ EmailJS
        {
          to_email: email,
          message: resetCode,
        },
        "WdGM2-SJ8kBhN8skx" // Public Key từ EmailJS
      );
      console.log("Email sent successfully:", response);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Unable to send verification code email");
    }
  };

  const handleCodeSubmit = () => {
    setError("");
    setSuccess("");

    if (resetCode === generatedCode) {
      setSuccess("Verification code confirmed. Please set your new password.");
      setShowCodeInput(false);
      setShowPasswordReset(true);
    } else {
      setError("The verification code is incorrect. Please try again.");
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    try {
      const response = await axios.get(`https://mma-json-deploy.onrender.com/users/${userId}`);
      const user = response.data;

      user.account.password = newPassword;
      await axios.put(`https://mma-json-deploy.onrender.com/users/${userId}`, user);

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        navigation.navigate("Login"); // Chuyển hướng về màn hình Login
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);
      setError("An error occurred while resetting the password. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {!showCodeInput && !showPasswordReset ? (
        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send Verification Code</Text>
          </TouchableOpacity>
        </View>
      ) : showCodeInput ? (
        <View style={styles.form}>
          <Text style={styles.label}>Enter Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter verification code"
            value={resetCode}
            onChangeText={setResetCode}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={handleCodeSubmit}>
            <Text style={styles.buttonText}>Confirm Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.linkText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 20,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  success: {
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
  form: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  links: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#007bff",
    fontSize: 16,
    marginVertical: 5,
  },
});

export default ForgotPassword;
