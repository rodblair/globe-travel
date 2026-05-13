import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiBaseUrl, createTripDraft } from './src/api';
import { featuredTrip, savedTrips, starterPrompts, type TripDraft, type TripStop } from './src/trips';
import { colors, radius, shadow, spacing } from './src/theme';

type Tab = 'studio' | 'saved' | 'crew';

const tabs: { id: Tab; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'saved', label: 'Saved' },
  { id: 'crew', label: 'Crew' },
];

const moodColors: Record<TripStop['mood'], string> = {
  food: colors.terracotta,
  culture: colors.dustyAqua,
  rest: colors.moss,
  night: colors.brass,
};

function AppHeader() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>Globe.travel</Text>
        <Text style={styles.headerTitle}>Trip Studio</Text>
      </View>
      <View style={styles.compassMark}>
        <View style={styles.compassNeedle} />
      </View>
    </View>
  );
}

function TabBar({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tabButton, selected && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RouteThread({ stops }: { stops: TripStop[] }) {
  return (
    <View style={styles.routeThread}>
      {stops.map((stop, index) => (
        <View key={`${stop.time}-${stop.title}`} style={styles.stopRow}>
          <View style={styles.stopRail}>
            <View style={[styles.stopPin, { backgroundColor: moodColors[stop.mood] }]}>
              <Text style={styles.stopPinText}>{index + 1}</Text>
            </View>
            {index < stops.length - 1 ? <View style={styles.stopLine} /> : null}
          </View>
          <View style={styles.stopBody}>
            <View style={styles.stopMetaRow}>
              <Text style={styles.stopTime}>{stop.time}</Text>
              <Text style={styles.stopArea}>{stop.area}</Text>
            </View>
            <Text style={styles.stopTitle}>{stop.title}</Text>
            <Text style={styles.stopNote}>{stop.note}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TripMapCard({ trip }: { trip: TripDraft }) {
  return (
    <View style={styles.mapCard}>
      <View style={styles.mapFrame}>
        <View style={styles.gridLineHorizontal} />
        <View style={[styles.gridLineHorizontal, { top: '64%' }]} />
        <View style={styles.gridLineVertical} />
        <View style={[styles.gridLineVertical, { left: '68%' }]} />
        <View style={styles.brassRoute} />
        {trip.stops.map((stop, index) => (
          <View
            key={stop.title}
            style={[
              styles.mapPin,
              {
                left: `${18 + index * 19}%`,
                top: `${62 - (index % 2) * 30}%`,
                backgroundColor: moodColors[stop.mood],
              },
            ]}
          >
            <Text style={styles.mapPinText}>{index + 1}</Text>
          </View>
        ))}
        <Text style={styles.mapStamp}>{trip.city.toUpperCase()}</Text>
      </View>
      <View style={styles.tripStats}>
        <View>
          <Text style={styles.statLabel}>Consensus</Text>
          <Text style={styles.statValue}>{trip.consensus}%</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Crew</Text>
          <Text style={styles.statValue}>{trip.crew}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Budget</Text>
          <Text style={styles.statValue}>{trip.budget}</Text>
        </View>
      </View>
    </View>
  );
}

function StudioScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroPanel}>
        <Text style={styles.heroKicker}>Group trip workspace</Text>
        <Text style={styles.heroTitle}>Plan the trip everyone can say yes to.</Text>
        <Text style={styles.heroCopy}>
          Turn the messy group chat into a shareable route, friend feedback, and one calm itinerary.
        </Text>
      </View>

      <TripMapCard trip={featuredTrip} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's thread</Text>
        <Text style={styles.sectionMeta}>{featuredTrip.dates}</Text>
      </View>
      <RouteThread stops={featuredTrip.stops} />
    </ScrollView>
  );
}

function SavedScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Saved maps</Text>
        <Text style={styles.sectionMeta}>{savedTrips.length} drafts</Text>
      </View>
      {savedTrips.map((trip) => (
        <Pressable key={trip.id} style={styles.savedCard}>
          <View style={styles.savedCardTop}>
            <View>
              <Text style={styles.savedCity}>{trip.city}</Text>
              <Text style={styles.savedTitle}>{trip.title}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{trip.status}</Text>
            </View>
          </View>
          <View style={styles.savedCardBottom}>
            <Text style={styles.savedMeta}>{trip.dates}</Text>
            <Text style={styles.savedMeta}>{trip.crew}</Text>
            <Text style={styles.savedMeta}>{trip.consensus}% aligned</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CrewScreen() {
  const [prompt, setPrompt] = useState(starterPrompts[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  const title = useMemo(() => {
    const destination = prompt.match(/\b(?:in|to)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i)?.[1]?.trim();
    return destination ? `Trip to ${destination}` : 'Group Trip Draft';
  }, [prompt]);

  async function handleCreateDraft() {
    if (!prompt.trim()) return;
    setIsCreating(true);
    setCreatedTripId(null);
    try {
      const result = await createTripDraft({
        title,
        days: 3,
        travelers: 4,
        vibe: prompt.trim(),
      });
      setCreatedTripId(result.tripId);
    } catch (error) {
      Alert.alert(
        'Could not create draft',
        `Start the web client and set EXPO_PUBLIC_API_URL if needed. Current API: ${apiBaseUrl}`,
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardScreen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.promptPanel}>
          <Text style={styles.heroKicker}>Ask Globe</Text>
          <Text style={styles.promptTitle}>Describe the trip in plain language.</Text>
          <TextInput
            multiline
            onChangeText={setPrompt}
            placeholder="Tell Globe where you want to go, who is coming, and what matters."
            placeholderTextColor={colors.slateFog}
            style={styles.promptInput}
            value={prompt}
          />
          <Pressable disabled={isCreating} onPress={handleCreateDraft} style={[styles.primaryButton, isCreating && styles.primaryButtonDisabled]}>
            {isCreating ? <ActivityIndicator color={colors.deepHorizonNavy} /> : <Text style={styles.primaryButtonText}>Create draft map</Text>}
          </Pressable>
          {createdTripId ? <Text style={styles.successText}>Draft created: {createdTripId}</Text> : null}
          <Text style={styles.apiText}>API: {apiBaseUrl}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Starter prompts</Text>
          <Text style={styles.sectionMeta}>Tap to use</Text>
        </View>
        {starterPrompts.map((item) => (
          <Pressable key={item} onPress={() => setPrompt(item)} style={styles.promptChip}>
            <Text style={styles.promptChipText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('studio');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <AppHeader />
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <View style={styles.content}>
          {activeTab === 'studio' ? <StudioScreen /> : null}
          {activeTab === 'saved' ? <SavedScreen /> : null}
          {activeTab === 'crew' ? <CrewScreen /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.creamVellum,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.creamVellum,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    color: colors.brass,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: colors.deepHorizonNavy,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 2,
  },
  compassMark: {
    alignItems: 'center',
    borderColor: colors.ruleStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  compassNeedle: {
    backgroundColor: colors.brass,
    borderRadius: radius.pill,
    height: 25,
    transform: [{ rotate: '34deg' }],
    width: 3,
  },
  tabBar: {
    backgroundColor: colors.paperRecessed,
    borderColor: colors.rule,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: spacing.xl,
    padding: 4,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.deepHorizonNavy,
  },
  tabText: {
    color: colors.ink2,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.creamVellum,
  },
  content: {
    flex: 1,
  },
  keyboardScreen: {
    flex: 1,
  },
  screenContent: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 44,
  },
  heroPanel: {
    backgroundColor: colors.deepHorizonNavy,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  heroKicker: {
    color: colors.brassHover,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.creamVellum,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 38,
  },
  heroCopy: {
    color: '#d8cfbc',
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  mapCard: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadow,
  },
  mapFrame: {
    aspectRatio: 1.18,
    backgroundColor: colors.paperRecessed,
    borderColor: colors.ruleStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridLineHorizontal: {
    backgroundColor: colors.rule,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '34%',
  },
  gridLineVertical: {
    backgroundColor: colors.rule,
    bottom: 0,
    left: '33%',
    position: 'absolute',
    top: 0,
    width: 1,
  },
  brassRoute: {
    backgroundColor: colors.brass,
    height: 3,
    left: '22%',
    position: 'absolute',
    right: '20%',
    top: '47%',
    transform: [{ rotate: '-14deg' }],
  },
  mapPin: {
    alignItems: 'center',
    borderColor: colors.paperRaised,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    width: 34,
  },
  mapPinText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  mapStamp: {
    bottom: spacing.md,
    color: colors.ink2,
    fontSize: 11,
    fontWeight: '800',
    left: spacing.md,
    letterSpacing: 2,
    position: 'absolute',
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
  },
  statLabel: {
    color: colors.slateFog,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.deepHorizonNavy,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.deepHorizonNavy,
    fontSize: 22,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.slateFog,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  routeThread: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  stopRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stopRail: {
    alignItems: 'center',
    width: 34,
  },
  stopPin: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stopPinText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  stopLine: {
    backgroundColor: colors.brass,
    flex: 1,
    marginVertical: 6,
    minHeight: 58,
    opacity: 0.45,
    width: 2,
  },
  stopBody: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  stopMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 4,
  },
  stopTime: {
    color: colors.brass,
    fontSize: 12,
    fontWeight: '900',
  },
  stopArea: {
    color: colors.slateFog,
    fontSize: 12,
    fontWeight: '700',
  },
  stopTitle: {
    color: colors.deepHorizonNavy,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  stopNote: {
    color: colors.ink2,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  savedCard: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  savedCardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  savedCity: {
    color: colors.brass,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  savedTitle: {
    color: colors.deepHorizonNavy,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 3,
  },
  statusPill: {
    backgroundColor: colors.paperSumi,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  statusText: {
    color: colors.ink2,
    fontSize: 11,
    fontWeight: '800',
  },
  savedCardBottom: {
    borderTopColor: colors.rule,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  savedMeta: {
    color: colors.ink2,
    fontSize: 13,
    fontWeight: '700',
  },
  promptPanel: {
    backgroundColor: colors.deepHorizonNavy,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  promptTitle: {
    color: colors.creamVellum,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  promptInput: {
    backgroundColor: '#142a40',
    borderColor: 'rgba(246, 241, 230, 0.18)',
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.creamVellum,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 150,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.brass,
    borderRadius: radius.pill,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 50,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: colors.deepHorizonNavy,
    fontSize: 15,
    fontWeight: '900',
  },
  successText: {
    color: '#b8d6b1',
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  apiText: {
    color: '#d8cfbc',
    fontSize: 12,
    marginTop: spacing.sm,
  },
  promptChip: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.rule,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  promptChipText: {
    color: colors.deepHorizonNavy,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});
