import { ThemedView } from "@/components/ThemedView";
import { Header } from "@/components/Header";
import { useSession } from "@/ctx";
import { ThemedText } from "@/components/ThemedText";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Profile() {
  const navigation = useNavigation();

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        <Header.Root>
          <Header.Action
            action={navigation.goBack}
            iconName={"arrow-back"}
            libraryName="Ionicons"
            alignLeft={true}
          />
          <Header.Title title="Perfil" />
        </Header.Root>
        <View
          style={{
            flex: 1,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ThemedText>Oi</ThemedText>
        </View>
      </ThemedView>
    </>
  );
}
