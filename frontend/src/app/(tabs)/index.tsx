import Header from '@/app/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 bg-white dark:bg-red-500">
      <Header title='teste'/>
    </View>
  );
}
