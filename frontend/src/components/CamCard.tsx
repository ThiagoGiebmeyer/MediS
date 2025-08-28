import React from "react";
import MView from "./MView";
import MText from "./MText";

import { Cam } from "@/types";
import { FlatList, TouchableOpacity } from "react-native";
import MIcon from "./MIcon";

type CamCardProps = {
  data: Cam;
};

function CamCard({ data }: CamCardProps) {
  function returnIcon(sensorData: string) {
    const iconSize = 18;
    const iconColor = "white";

    if (sensorData.includes("Temperatura")) {
      return <MIcon name="Thermometer" color={iconColor} size={iconSize} />;
    } else if (sensorData.includes("Umidade")) {
      return <MIcon name="Droplets" color={iconColor} size={iconSize} />;
    } else if (sensorData.includes("Pressão")) {
      return <MIcon name="CircleGauge" color={iconColor} size={iconSize} />;
    } else if (sensorData.includes("Altitude")) {
      return <MIcon name="MoveVertical" color={iconColor} size={iconSize} />;
    } else return;
  }

  return (
    <MView className={`flex-1 items-center w-[95vw]`}>
      {/* Container com borda em degradê */}
      <MView className="w-full rounded-lg p-[2px] bg-gradient-to-t dark:from-primary-a0 dark:to-primary-a30">
        {/* Conteúdo interno */}
        <MView
          className="flex-1  bg-primary-a0 border-2 rounded-lg
         dark:bg-surface-a10  dark:border-surface-a30
           border-white items-center"
        >
          {/* Titulo */}
          <MView className="w-full flex-1 rounded-lg p-2 mb-2">
            <MText className="text-center text-xl text-white font-geistBold">
              {data.title}
            </MText>
          </MView>

          {/* Conteudo */}
          <MView className="w-full">
            <FlatList
              data={data.sensores}
              className="w-full"
              renderItem={({ item }) => (
                <>
                  <MView className="bg-white dark:bg-surface-a10 rounded-lg p-2 w-[95%] self-center border-surface-a30 border-2 ">
                    <MText className="dark:text-white font-geistSemiBold text-center">
                      {item.title}
                    </MText>
                  </MView>

                  <MView className="bg-transparent w-[95%] self-center mt-2 mb-2">
                    {Array.isArray(item.data) &&
                      item.data.map((sensorData, index) => (
                        <MView className="flex-row gap-2 items-center">
                          {returnIcon(sensorData)}

                          <MText key={index} className="text-white">
                            {sensorData}
                          </MText>
                        </MView>
                      ))}
                  </MView>
                </>
              )}
            />
          </MView>

          <MView className="w-[20%] self-center bg-primary-a0 border-1 h-1 border-primary-a0 opacity-50 rounded-lg" />

          <TouchableOpacity className="bg-white dark:bg-surface-a10 rounded-lg p-2 w-[95%] self-center flex-row justify-between mb-2 mt-4 border-surface-a30 border-2">
            <MText className="dark:text-white font-geistSemiBold w-full">
              Ver dados
            </MText>
            <MIcon name={"ChevronRight"} color="white" size={24} />
          </TouchableOpacity>
        </MView>
      </MView>
    </MView>
  );
}

export default CamCard;
