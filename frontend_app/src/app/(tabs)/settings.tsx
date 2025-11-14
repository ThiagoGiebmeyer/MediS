import { View, Text, TouchableOpacity } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-primary text-3xl font-bold mb-4">
        Bem-vindo de volta
      </Text>

      <TouchableOpacity className="bg-surface px-6 py-3 rounded-xl">
        <Text className="text-secondary text-lg font-semibold">
          Entrar
        </Text>
      </TouchableOpacity>

      <Text className="text-secondary mt-6 opacity-70">
        App com tema escuro personalizado 🌙
      </Text>
    </View>
  );
}
