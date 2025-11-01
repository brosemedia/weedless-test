import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import MissionCard from '../components/MissionCard';

export default function Missions() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Missionen</Text>
      <View style={styles.grid}>
        <MissionCard
          title="10.000 Schritte"
          points={50}
          image={{
            uri:
              'https://images.unsplash.com/photo-1520975693416-35a7b2c92a02?q=80&w=1887&auto=format&fit=crop',
          }}
          completed={false}
        />
        <View style={{ height: 16 }} />
        <MissionCard
          title="Trinke 2L Wasser"
          points={30}
          image={{
            uri:
              'https://images.unsplash.com/photo-1471943311424-646960669fbc?q=80&w=1935&auto=format&fit=crop',
          }}
          completed
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },
  grid: {
    alignItems: 'center',
  },
});

