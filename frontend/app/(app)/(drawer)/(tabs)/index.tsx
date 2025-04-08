import { ThemedView } from "@/components/ThemedView";
import { Header } from "@/components/Header";
import { ThemedText } from "@/components/ThemedText";
import {
  useColorScheme,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { Collapsible } from "@/components/Collapsible";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const data = [
  {
    id: 1,
    title: "MediS-CAM #1",
    data: [
      {
        title: "DHT11",
        type: "sensor",
        details: [
          { label: "Temperatura", value: "25 °C" },
          { label: "Umidade", value: "25%" },
        ],
      },
      {
        title: "BM180",
        type: "sensor",
        details: [
          { label: "Altitude", value: "648m" },
          { label: "Pressão ATM", value: "750ppm" },
        ],
      },
      {
        title: "Último registro",
        type: "last_register",
        details: [
          { label: "Coletado Hoje às", value: new Date().toLocaleTimeString() },
          { label: "Lat", value: "-23.5505" },
          { label: "Long", value: "-46.6333" },
        ],
        image:
          "https://cdn.noticiasagricolas.com.br/dbimagens/3c2347a4f9973c0c272c9c806345ec99.jpg",
      },
    ],
  },
  {
    id: 1,
    title: "MediS-CAM #2",
    data: [
      {
        title: "DHT11",
        type: "sensor",
        details: [
          { label: "Temperatura", value: "25 °C" },
          { label: "Umidade", value: "25%" },
        ],
      },
      {
        title: "BM180",
        type: "sensor",
        details: [
          { label: "Altitude", value: "648m" },
          { label: "Pressão ATM", value: "750ppm" },
        ],
      },
      {
        title: "Último registro",
        type: "last_register",
        details: [
          { label: "Coletado Hoje às", value: new Date().toLocaleTimeString() },
          { label: "Lat", value: "-23.5505" },
          { label: "Long", value: "-46.6333" },
        ],
        image:
          "https://cdn.noticiasagricolas.com.br/dbimagens/3c2347a4f9973c0c272c9c806345ec99.jpg",
      },
    ],
  },
];

export default function HomeScreen() {
  type RootStackParamList = {
    ImageViewer: {
      imageUrl: string;
      title: string;
      location: {
        latitude: number;
        longitude: number;
      };
    };
  };

  const colorScheme = useColorScheme() ?? "dark";
  const navigation = useNavigation();
  const backgroundColorTheme = Colors[colorScheme].tint;
  const colorTheme = Colors[colorScheme].text;

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
              action={navigation.openDrawer}
              iconName={"person-circle"}
              libraryName="Ionicons"
              alignLeft={true}
            />
            <Header.Title title="MediS" />
            <Header.Action
              action={() => {}}
              iconName={"location"}
              libraryName="Ionicons"
              alignLeft={false}
            />
          </Header.Root>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              alignItems: "center",
            }}
          >
            {data.map((item, index) => (
              <ThemedView
                key={index}
                style={{
                  width: "90%",
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: Colors[colorScheme].drawer.background,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 8,
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: Colors[colorScheme].tint,
                    borderTopStartRadius: 50,
                    borderBottomEndRadius: 50,
                  }}
                >
                  <ThemedText
                    type="title"
                    style={{ color: Colors[colorScheme].text }}
                  >
                    {item.title}
                  </ThemedText>
                </View>
                {item.data.map((detail, detailIndex) => {
                  if (detail.type === "last_register") {
                    return (
                      <>
                        <View
                          style={{
                            borderColor: Colors[colorScheme].icon,
                            width: "50%",
                            alignSelf: "center",
                            marginBottom: 8,
                            marginTop: 8,
                            borderWidth: 1,
                          }}
                        ></View>
                        <Collapsible key={detailIndex} title={detail.title}>
                          <View
                            style={{
                              borderRadius: 8,
                              padding: 8,
                            }}
                          >
                            {detail.details.map((info, infoIndex) => (
                              <ThemedText
                                key={infoIndex}
                                type="subtitle"
                                style={{ color: colorTheme }}
                              >
                                {info.label}: {info.value}
                              </ThemedText>
                            ))}
                            {detail.image && (
                              <TouchableOpacity
                                style={{
                                  width: "100%",
                                  overflow: "hidden",
                                  height: 200,
                                  marginTop: 8,
                                  shadowColor: "#FFF",
                                  shadowOffset: {
                                    width: 8,
                                    height: 8,
                                  },
                                  shadowRadius: 16,
                                  shadowOpacity: 0.1,
                                }}
                                onPress={() => {
                                  router.push({
                                    pathname: "/imageViewer",
                                    params: {
                                      imageUrl: detail.image,
                                      title: detail.title,
                                      latitude: String(
                                        detail.details[1].value
                                      ),
                                      longitude: String(
                                        detail.details[2].value
                                      ),
                                    },
                                  });
                                }}
                              >
                                <Image
                                  source={{ uri: detail.image }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 8,
                                    justifyContent: "center",
                                  }}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </Collapsible>
                      </>
                    );
                  } else {
                    return (
                      <ThemedView
                        key={detailIndex}
                        style={{
                          marginTop: 8,
                          backgroundColor:
                            Colors[colorScheme].drawer.background,
                        }}
                      >
                        <ThemedText type="title" style={{ color: colorTheme }}>
                          {detail.title}
                        </ThemedText>
                        {detail.details.map((info, infoIndex) => (
                          <ThemedText
                            key={infoIndex}
                            type="subtitle"
                            style={{ color: colorTheme }}
                          >
                            {info.label}: {info.value}
                          </ThemedText>
                        ))}
                      </ThemedView>
                    );
                  }
                })}
              </ThemedView>
            ))}
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}
