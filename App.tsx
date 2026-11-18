import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Jua_400Regular, useFonts } from '@expo-google-fonts/jua';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumScreen } from './src/screens/AlbumScreen';
import { BirthScreen } from './src/screens/BirthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { GrowthScreen } from './src/screens/GrowthScreen';
import { TipsScreen } from './src/screens/TipsScreen';
import { AramProvider, useAram } from './src/store';
import { PaletteProvider, usePalette } from './src/palette';
import { colors, fonts, Gender, palettes, shadow } from './src/theme';
import { Backdrop, Bean } from './src/ui';

type Tab = 'home' | 'tips' | 'growth' | 'album' | 'timeline' | 'birth';

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: '오늘' },
  { id: 'tips', label: '꿀팁' },
  { id: 'growth', label: '성장' },
  { id: 'album', label: '기록' },
  { id: 'timeline', label: '흐름' },
  { id: 'birth', label: '출생' },
];

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Jua_400Regular });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AramProvider>
        <Shell fontsReady={fontsLoaded || Boolean(fontError)} />
      </AramProvider>
    </SafeAreaProvider>
  );
}

function Shell({ fontsReady }: { fontsReady: boolean }) {
  const { store, ready, error } = useAram();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);
  const [previewGender, setPreviewGender] = useState<Gender>('unknown');
  const gender = store.profile?.gender ?? previewGender;

  return (
    <PaletteProvider gender={gender}>
    <View style={[styles.backdrop, { backgroundColor: palettes[gender].edge }]}>
      <View style={styles.column}>
        <Backdrop>
        {!ready || !fontsReady ? (
          <View style={styles.center}>
            <Bean size={80} sleepy />
            <Text style={styles.loading}>기록을 꺼내고 있어요</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Bean size={80} sleepy />
            <Text style={styles.loading}>{error}</Text>
          </View>
        ) : !store.profile ? (
          <SetupScreen gender={previewGender} onGenderChange={setPreviewGender} />
        ) : settings ? (
          <SettingsScreen onClose={() => setSettings(false)} />
        ) : (
          <View style={styles.main}>
            {tab === 'home' ? <HomeScreen onNavigate={setTab} onOpenSettings={() => setSettings(true)} /> : null}
            {tab === 'tips' ? <TipsScreen /> : null}
            {tab === 'growth' ? <GrowthScreen /> : null}
            {tab === 'album' ? <AlbumScreen /> : null}
            {tab === 'timeline' ? <TimelineScreen /> : null}
            {tab === 'birth' ? <BirthScreen /> : null}
            <TabBar tab={tab} onChange={setTab} />
          </View>
        )}
        </Backdrop>
      </View>
    </View>
    </PaletteProvider>
  );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  return (
    <View style={[styles.tabWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(item.id)}
              style={[styles.tab, active && { backgroundColor: palette.soft }]}
            >
              <Text style={[styles.tabLabel, active && { color: palette.accentDark }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden' },
  main: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  loading: { color: colors.muted, fontSize: 17, fontFamily: fonts.cute },
  tabWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 999,
    padding: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    ...shadow,
    shadowOpacity: 0.12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: 999 },
  tabLabel: { color: colors.muted, fontSize: 15, fontFamily: fonts.cute },
  tabLabelOn: { color: colors.ink },
});
