import { useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Toast from "react-native-toast-message";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useSession } from "@/ctx";
import PlantGrowthIcon from "@/components/ui/IconPlantGrowth";
import PrimaryButton from "@/components/PrimaryButton";
import CustomTextInput from "@/components/CustomTextInput";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
export default function SignInScreen() {
  const colorScheme = useColorScheme() ?? "dark";

  const { signIn, session } = useSession();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSignIn = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Toast.show({
        type: "error",
        text1: "Ooops!",
        text2: "Verifique seu email",
      });
    }

    if (!password.length) {
      return Toast.show({
        type: "error",
        text1: "Ooops!",
        text2: "Verifique sua senha",
      });
    }

    signIn(String(new Date()));
  };

  if(session){
    return router.replace('/');
  }

  return (
    <>
      <ThemedView style={styles.container}>
        <View style={{ position: "absolute", top: "10%", left: "auto" }}>
          <PlantGrowthIcon width={140} height={140} />
        </View>
        <ThemedText
          type="title"
          style={{
            color: Colors[colorScheme].text,
          }}
        >
          Bem-vindo ao MediS!
        </ThemedText>
        <CustomTextInput
          placeholder="Email"
          value={email}
          keyboardType="email-address"
          onChangeText={setEmail}
          style={{
            marginBottom: 10,
          }}
        />
        <CustomTextInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            marginBottom: 10,
          }}
        />
        <PrimaryButton
          fn={handleSignIn}
          title="Entrar"
          style={{
            width: "50%",
          }}
        />
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <ThemedText
            type="subtitle"
            style={{ color: Colors[colorScheme].text }}
          >
            Não tem uma conta?{" "}
          </ThemedText>
          <ThemedText
            type="link"
            style={{ color: Colors[colorScheme].tint }}
            onPress={() => router.push("/sign-up")}
          >
            Cadastre-se
          </ThemedText>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginBottom: 10,
    marginTop: 10,
  },
});
