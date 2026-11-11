import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { TransactionEditorScreen } from '../features/transactions/TransactionEditorScreen';
import { GoalEditorScreen } from '../features/goals/GoalEditorScreen';
import { AccountEditorScreen } from '../features/accounts/AccountEditorScreen';
import { AccountsScreen } from '../features/accounts/AccountsScreen';
import { CategoriesScreen } from '../features/profile/CategoriesScreen';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { ChangePasswordScreen } from '../features/profile/ChangePasswordScreen';
import { Launcher } from '../components/system/Launcher';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const status = useAuthStore((state) => state.status);

  const navTheme: NavTheme = {
    dark: theme.scheme === 'dark',
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surfaceRaised,
      text: theme.colors.text,
      border: theme.colors.hairline,
      notification: theme.colors.negative,
    },
    fonts: {
      regular: { fontFamily: 'Manrope_400Regular', fontWeight: '400' },
      medium: { fontFamily: 'Manrope_500Medium', fontWeight: '500' },
      bold: { fontFamily: 'Manrope_700Bold', fontWeight: '700' },
      heavy: { fontFamily: 'Manrope_800ExtraBold', fontWeight: '800' },
    },
  };

  if (status === 'booting') return <Launcher />;

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'signedIn' ? (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
            animationDuration: 300,
          }}
        >
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="TransactionEditor"
            component={TransactionEditorScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 340,
            }}
          />
          <Stack.Screen
            name="GoalEditor"
            component={GoalEditorScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 340,
            }}
          />
          <Stack.Screen
            name="AccountEditor"
            component={AccountEditorScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 340,
            }}
          />
          <Stack.Screen name="Accounts" component={AccountsScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
