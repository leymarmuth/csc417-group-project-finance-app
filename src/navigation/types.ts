import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TransactionKind } from '../types/models';

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Activity: undefined;
  Insights: undefined;
  Goals: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  TransactionEditor: { id?: string; kind?: TransactionKind } | undefined;
  AccountEditor: { id?: string } | undefined;
  GoalEditor: { id?: string } | undefined;
  Accounts: undefined;
  Categories: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
