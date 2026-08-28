import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import PreviewScreen from '../screens/documents/PreviewScreen';
import ReaderScreen from '../screens/documents/ReaderScreen';
import ViewerScreen from '../screens/documents/ViewerScreen';
import SearchScreen from '../screens/documents/SearchScreen';
import ScanQRScreen from '../screens/documents/ScanQRScreen';
import FoldersScreen from '../screens/folders/FoldersScreen';
import MfaSetupScreen from '../screens/profile/MfaSetupScreen';
import useTheme from '../hooks/useTheme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Preview" component={PreviewScreen} options={{ title: 'Document' }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: 'Reader' }} />
      <Stack.Screen name="Viewer" component={ViewerScreen} options={{ title: 'Document' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="Folders" component={FoldersScreen} options={{ title: 'Folders' }} />
      <Stack.Screen name="ScanQR" component={ScanQRScreen} options={{ title: 'Scan QR code' }} />
      <Stack.Screen
        name="MfaSetup"
        component={MfaSetupScreen}
        options={{ title: 'Two-step verification' }}
      />
    </Stack.Navigator>
  );
}