"use client"

import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [userToken, setUserToken] = useState(null)

  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      setUserToken(token)
    } catch (e) {
      console.log(e)
    }
    setIsLoading(false)
  }

  const login = async (user) => {
    setIsLoading(true)
    try {
      await AsyncStorage.setItem("userToken", "dummy-auth-token")
      await AsyncStorage.setItem("user", JSON.stringify(user))
      setUserToken("dummy-auth-token")
    } catch (e) {
      console.log(e)
    }
    setIsLoading(false)
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await AsyncStorage.removeItem("userToken")
      await AsyncStorage.removeItem("user")
      setUserToken(null)
    } catch (e) {
      console.log(e)
    }
    setIsLoading(false)
  }

  return <AuthContext.Provider value={{ isLoading, userToken, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

