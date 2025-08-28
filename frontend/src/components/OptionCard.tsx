import React from "react";
import MView from "@/components/MView";
import MIcon from "@/components/MIcon";
import MText from "@/components/MText";
import { TouchableOpacity } from "react-native";
import { Icons } from "@/lib/icons";

type OptionCardProps = {
  icon: keyof typeof Icons;
  label: string;
  onPress?: () => void;
};

export default function OptionCard({ icon, label, onPress }: OptionCardProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <MView className="w-full p-4 bg-primary-a0 items-center rounded-xl flex-row justify-between">
        <MView className="flex-row items-center">
          <MIcon
            name={icon}
            color="white"
            size={36}
          />
          <MText className="text-white"> | {label}</MText>
        </MView>
        <MIcon
          name={"ChevronRight"}
          color="white"
          size={24}
        />
      </MView>
    </TouchableOpacity>
  );
}
