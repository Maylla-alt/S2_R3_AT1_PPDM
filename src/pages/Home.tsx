import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../types/RootStackParamList";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function Home() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text>Travel Diary</Text>
    <TouchableOpacity onPress={() => navigation.navigate("Camera")}>
      <Text>
        Câmera
      </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Location")}>
      <Text>
        Localização
      </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
