import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { AuthProvider, useAuth } from "./AuthContext"
import Home from "./screens/Home";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Welcome from "./screens/Welcome";
import MainApp from "./MainApp"
import FavouritePhotos from "./screens/FavouritePhotos";
import PhotoDetails from "./screens/PhotoDetails";
import PostScreen from "./screens/PostScreen";
import ProfileStack from "./screens/ProfileStack";
import MapScreen from "./screens/MapScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createNativeStackNavigator()

function Navigation() {
  const { isLoading, userToken } = useAuth()

  if (isLoading) {
    return null // or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
          </>
        ) : (
          <>
          <Stack.Screen name="MainApp" component={MainApp} />
          <Stack.Screen name="FavouritePhotos" component={FavouritePhotos} />
          <Stack.Screen name="PhotoDetails" component={PhotoDetails} />
          <Stack.Screen name="PostScreen" component={PostScreen} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="ProfileStack" component={ProfileStack} />
          <Stack.Screen name="MapScreen" component={MapScreen} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  )
}

