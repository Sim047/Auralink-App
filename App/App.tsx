import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { api } from './src/api';
import { socket } from './src/socket';

interface Event {
  _id: string;
  title: string;
  sport: string;
  description: string;
  participants?: any[];
}

export default function App() {
  const [token, setToken] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (loggedIn) {
      fetchEvents();
      socket.connect();
      socket.on('participant_joined', (payload: any) => {
        setStatus(`Participant joined: ${payload.participantId}`);
        fetchEvents();
      });
    }
    return () => {
      socket.off('participant_joined');
      socket.disconnect();
    };
  }, [loggedIn]);

  const doLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const t = res.data.token;
      setToken(t);
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      setLoggedIn(true);
    } catch (e: any) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.events || res.data);
    } catch (e: any) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const joinEvent = async (id: string) => {
    try {
      await api.post(`/events/${id}/join`, {});
      setStatus('Joined event successfully');
      fetchEvents();
    } catch (e: any) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Auralink Expo App</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} autoCapitalize='none' value={email} onChangeText={setEmail} />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
        <View style={{ marginTop: 12 }}>
          <Button title='Login' onPress={doLogin} />
        </View>
        {!!status && <Text style={styles.status}>{status}</Text>}
        <Text style={styles.env}>API: {Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Discover Events</Text>
      {!!status && <Text style={styles.status}>{status}</Text>}
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.sport}</Text>
            <Text style={styles.cardText}>{item.description}</Text>
            <TouchableOpacity style={styles.joinBtn} onPress={() => joinEvent(item._id)}>
              <Text style={styles.joinTxt}>Join</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0f172a' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  label: { color: '#94a3b8', marginTop: 8 },
  input: { backgroundColor: '#1f2937', borderRadius: 8, padding: 10, color: '#fff', marginTop: 4 },
  status: { color: '#fbcfe8', marginTop: 12 },
  env: { color: '#93c5fd', marginTop: 8, fontSize: 12 },
  card: { backgroundColor: '#111827', borderRadius: 12, padding: 12, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cardSubtitle: { color: '#67e8f9', fontSize: 12, marginBottom: 6 },
  cardText: { color: '#e5e7eb', fontSize: 13, marginBottom: 10 },
  joinBtn: { backgroundColor: '#06b6d4', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  joinTxt: { color: '#fff', fontWeight: '600' }
});
