// index.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Alert,
  Platform,
  StatusBar,
  ImageBackground,
} from 'react-native';
import EventSource from 'react-native-event-source';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const BASE_URL = 'https://app.exemple.com';
const TOKEN = 'CHANGEME';

// Handler pour les notifications push
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Inscription aux notifications push Expo
async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d’obtenir les notifications push.');
        return null;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } else {
      console.warn('Notifications push non supportées sur émulateur');
      return null;
    }
  } catch (error) {
    console.error('Erreur notification push :', error);
    return null;
  }
}

// Envoi du token push au backend
async function sendTokenToBackend(token: string) {
  try {
    await axios.post(
      `${BASE_URL}/api/register_push_token?token=${TOKEN}`,
      { expoPushToken: token }
    );
  } catch (error) {
    console.error('Erreur envoi token au backend :', error);
  }
}

export default function App() {
  const [lockStatus, setLockStatus] = useState<'locked' | 'unlocked'>('locked');

  useEffect(() => {
    // 1) Notifications push
    registerForPushNotificationsAsync().then(token => {
      if (token) sendTokenToBackend(token);
    });
    const sub1 = Notifications.addNotificationReceivedListener(n => console.log(n));
    const sub2 = Notifications.addNotificationResponseReceivedListener(r => console.log(r));

    // 2) Connexion au flux SSE
    const es = new EventSource(`${BASE_URL}/stream?token=${TOKEN}`);
    es.addEventListener('status', e => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === 'locked' || data.status === 'unlocked') {
          setLockStatus(data.status);
        }
      } catch {}
    });
    es.onerror = err => {
      console.warn('SSE error', err);
      // tentative de reconnexion après 5s
      setTimeout(() => es.open(), 5000);
    };

    return () => {
      sub1.remove();
      sub2.remove();
      es.close();
    };
  }, []);

  // Fonction du bouton
  const toggleLock = async () => {
    try {
      const resp = await axios.post(`${BASE_URL}/unlock?token=${TOKEN}`);
      if (resp.data.status === 'unlocked') {
        setLockStatus('unlocked');
        Alert.alert('Succès', 'La porte est déverrouillée !');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d’ouvrir la porte.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView
        style={[
          styles.container,
          Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight },
        ]}
      >
        {/* LOGO dynamique */}
        <View style={styles.logoContainer}>
          <Image
            source={
              lockStatus === 'unlocked'
                ? require('../../assets/facilock_logo_unlocked.png')
                : require('../../assets/facilock_logo_locked.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* BOUTON inchangé */}
        <TouchableOpacity style={styles.button} onPress={toggleLock}>
          <Text style={styles.buttonText}>Déverrouiller la porte</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 80,   // ajuste la marge pour remonter le logo
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 400,
  },
  button: {
    width: '80%',
    backgroundColor: '#0C223B',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
  },
});
