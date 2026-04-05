import React from 'react';
import { Text, View } from 'react-native';
import tw from '../../../lib/tailwind';

export default function GameScreenMobile() {
  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <Text style={tw`text-2xl font-black text-[#003366] uppercase`}>
        En desarrollo
      </Text>
      <Text style={tw`text-slate-500 mt-2`}>
        Versión móvil del registro de juego próximamente.
      </Text>
    </View>
  );
}