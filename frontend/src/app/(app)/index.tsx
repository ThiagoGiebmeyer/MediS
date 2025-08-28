import CamCard from "@/components/CamCard";
import MView from "@/components/MView";
import { Cam } from "@/types";
import { Dimensions, FlatList, SafeAreaView } from "react-native";

import MText from "@/components/MText";
import MIcon from "@/components/MIcon";
import { useEffect, createRef, useState, useRef } from "react";
import MAnimatedHeader from "@/components/MAnimatedHeader";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  withDelay,
} from "react-native-reanimated";
import MTabBar from "@/components/MTabBar";
import OptionCard from "@/components/OptionCard";
import MCamera from "@/components/MCamera";
import { useRequest } from "@/hooks/request/useRequest";
import { toast } from "sonner-native";

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [camera, setCamera] = useState({ isOpen: false, isLoading: false });

  const cameraRef = useRef<Camera>(null);

  const cams = [
    {
      id: 1,
      title: "MediS_CAM #1",
      localizacao: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
      sensores: [
        {
          id: 1,
          title: "DHT11",
          data: ["Temperatura: 25 °C", "Umidade: 60 %"],
        },
        {
          id: 2,
          title: "BMP180",
          data: ["Pressão ATM: 101325 Pa", "Altitude: 665m"],
        },
      ],
    },
    {
      id: 2,
      title: "MediS_CAM #2",
      localizacao: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
      sensores: [
        {
          id: 1,
          title: "DHT11",
          data: ["Temperatura: 25 °C", "Umidade: 60 %"],
        },
        {
          id: 2,
          title: "BMP180",
          data: ["Pressão ATM: 101325 Pa", "Altitude: 665m"],
        },
      ],
    },
  ] as Cam[];

  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const topDistance = useSharedValue(SCREEN_HEIGHT);

  const AnimatedIcon = Animated.createAnimatedComponent(MIcon);
  const opacityValues = [
    useSharedValue(0.3),
    useSharedValue(0.3),
    useSharedValue(0.3),
    useSharedValue(0.3),
  ];

  const {
    data,
    loading,
    error,
    request: sendPhotoToAnalise,
  } = useRequest({
    url: "http://localhost:3000/api/imagens/validar",
    method: "POST",
  });

  const animatedStyles = opacityValues.map((opacity) =>
    useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: withTiming(1, { duration: 400 }) }],
    }))
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: topDistance.value,
      flex: 1,
      height: "100%",
    };
  });

  useEffect(() => {
    setCamera((curr) => ({ ...curr, isLoading: loading }));
    if (data) {
      toast.success("Imagem analisada com sucesso!", {
        description: "Estágio da planta: " + data.estagio,
        position: "bottom-center",
      });
    } else if (error) {
      toast.error("Inconsistência ao analisar imagem.", {
        description: error,
        position: "bottom-center",
      });
    } else if (loading) {
      toast.loading("Imagem enviada com sucesso!", {
        description:
          "Aguarde, estamos analisando a sua imagem, logo retornamos com o resultado!",
        position: "bottom-center",
      });
    }
  }, [error, data, loading]);

  const cameraOnPress = async () => {
    if (camera.isLoading) return;

    if (camera.isOpen) {
      const photo = await cameraRef?.current?.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      });

      if (photo?.base64) {
        sendPhotoToAnalise({
          data: {
            file: photo.base64,
          },
        });
      } else {
        toast("Imagem inválida, tente novamente.");
      }

      setCamera((curr) => ({ ...curr, isOpen: false }));
    } else {
      setCamera((curr) => ({ ...curr, isOpen: true }));
    }
  };

  useEffect(() => {
    opacityValues.forEach((opacity, index) => {
      opacity.value = withRepeat(
        withDelay(
          index * 150,
          withSequence(
            withTiming(1, {
              duration: 500,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0.0, {
              duration: 500,
              easing: Easing.inOut(Easing.ease),
            })
          )
        ),
        0,
        false
      );
    });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      topDistance.value = withTiming(0, {
        duration: 900,
      });
    }
  }, [isLoading]);

  useEffect(() => {
    if (camera.isOpen) {
      topDistance.value = withTiming(1920, {
        duration: 900,
      });
    }
  }, [camera.isOpen]);

  const haveData = cams.length > 0;

  return (
    <>
      <SafeAreaView className="dark:bg-surface-a10 bg-white items-center flex-1">
        {!camera.isOpen && (
          <>
            <MAnimatedHeader loading={isLoading} />
            <Animated.View style={[animatedStyle]}></Animated.View>
          </>
        )}

        {isLoading ? (
          <></>
        ) : camera.isOpen ? (
          <>
            <MCamera ref={cameraRef} />
          </>
        ) : haveData ? (
          <>
            <MView className="w-[95%] h-auto absolute mt-20">
              <FlatList
                data={cams}
                renderItem={({ item }) => <CamCard data={item} />}
                keyExtractor={(item) => item.id.toString()}
                className="h-full w-full "
                scrollEnabled
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                horizontal={true}
              />

              <MView className="w-[80%] self-center bg-primary-a0 m-2 border-1 h-1 border-primary-a0 opacity-50 rounded-lg" />

              <MView className="w-full self-center flex-1 gap-2 ">
                <OptionCard
                  icon="FileChartLine"
                  label="Relatório"
                  onPress={() => console.log("Relatório")}
                />
                <OptionCard
                  icon="ChartColumn"
                  label="Análise"
                  onPress={() => console.log("Análise")}
                />
              </MView>
            </MView>
          </>
        ) : (
          <>
            <MView className="w-[95%] self-center flex-1 gap-2 items-center">
              <MIcon name="CircleAlert" color="white" size={36} />
              <MText>Você não possui câmeras cadastadas...</MText>

              {animatedStyles.map((style, index) => (
                <AnimatedIcon
                  key={index}
                  name="ChevronDown"
                  color="white"
                  size={36}
                  style={[style]}
                />
              ))}
            </MView>
          </>
        )}

        {!isLoading && (
          <MTabBar
            icon={haveData ? "Camera" : "Plus"}
            onPress={cameraOnPress}
            renderLoading={camera.isLoading}
          />
        )}
      </SafeAreaView>
    </>
  );
}
