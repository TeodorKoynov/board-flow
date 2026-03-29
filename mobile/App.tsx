import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BoardListScreen } from "./src/screens/BoardListScreen";
import { BoardScreen } from "./src/screens/BoardScreen";
import { CardDetailScreen } from "./src/screens/CardDetailScreen";
import type { RootStackParamList } from "./src/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="BoardList"
        screenOptions={{
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#111827",
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#F9FAFB" },
        }}
      >
        <Stack.Screen
          name="BoardList"
          component={BoardListScreen}
          options={{ title: "My Boards" }}
        />
        <Stack.Screen name="Board" component={BoardScreen} />
        <Stack.Screen
          name="CardDetail"
          component={CardDetailScreen}
          options={{ title: "Card Details" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
