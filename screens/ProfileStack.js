import { createStackNavigator } from "@react-navigation/stack"
import ProfileScreen from "./ProfileScreen"
import ProfileEdit from "./ProfileEdit"

const Stack = createStackNavigator()

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} />
    </Stack.Navigator>
  )
}

