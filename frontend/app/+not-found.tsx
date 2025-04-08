import { Link, Stack } from "expo-router";
import { StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import PlantGrowthIcon from "@/components/ui/IconPlantGrowth";

export default function NotFoundScreen() {
  const colorScheme = useColorScheme() ?? "dark";

  return (
    <>
      <ThemedView style={styles.container}>
        <PlantGrowthIcon width={100} height={100} color="#ECEDEE" />

        <ThemedText
          type="title"
          style={{
            textAlign: "center",
            color: Colors[colorScheme].tint,
            marginTop: 8,
          }}
        >
          Parece que você está tentando acessar algo que não existe...
        </ThemedText>

        <Link href="/">
          <ThemedText type="link" style={{ color: Colors[colorScheme].text }}>
            Voltar
          </ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
