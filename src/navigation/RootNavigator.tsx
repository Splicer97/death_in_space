import React from 'react';
import {
  NavigationContainer,
  DarkTheme,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CharacterScreen from '../screens/CharacterScreen';
import CreateScreen from '../screens/CreateScreen';
import DataScreen from '../screens/DataScreen';
import HubScreen from '../screens/HubScreen';
import RollScreen from '../screens/RollScreen';
import RosterScreen from '../screens/RosterScreen';
import TablesScreen from '../screens/TablesScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.yellow,
    notification: colors.red,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.yellow,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Roster"
          component={RosterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Create"
          component={CreateScreen}
          options={{ title: 'НОВЫЙ ПЕРСОНАЖ', presentation: 'modal' }}
        />
        <Stack.Screen
          name="Character"
          component={CharacterScreen}
          options={{ title: 'ЛИСТ ПЕРСОНАЛЬНЫХ ДАННЫХ' }}
        />
        <Stack.Screen
          name="Tables"
          component={TablesScreen}
          options={{ title: 'СПРАВОЧНИК' }}
        />
        <Stack.Screen
          name="Roll"
          component={RollScreen}
          options={{ title: 'БРОСКИ', presentation: 'modal' }}
        />
        <Stack.Screen
          name="Hub"
          component={HubScreen}
          options={{ title: 'ХАБ' }}
        />
        <Stack.Screen
          name="Data"
          component={DataScreen}
          options={{ title: 'ДАННЫЕ И КОПИИ' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
