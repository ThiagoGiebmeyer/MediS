import { Header } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React from "react";
import { SafeAreaView, Image } from "react-native";

type ImageViewerProps = {
  imageUrl: string;
  title: string;
  latitude: number;
  longitude: number;
};

export default function ImageViewer() {
  const navigation = useNavigation();
  const { imageUrl, title, latitude, longitude } =
    useLocalSearchParams() as unknown as ImageViewerProps;

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView
          style={{
            flex: 1,
            paddingBottom: 68,
            width: "100%",
          }}
        >
          <Header.Root>
            <Header.Action
              action={navigation.goBack}
              iconName={"arrow-back"}
              libraryName="Ionicons"
              alignLeft={true}
            />
            <Header.Title title={title} />
          </Header.Root>

          {imageUrl ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                }}
                resizeMode="stretch"
              />
            </>
          ) : (
            <></>
          )}
        </ThemedView>
      </SafeAreaView>
    </>
  );
}
