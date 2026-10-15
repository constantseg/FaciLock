// HistoriqueScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  ImageBackground,   // <-- import pour le background
} from 'react-native';
import { Video } from 'expo-av';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = 'https://app.exemple.com';
const TOKEN = 'CHANGEME';

export default function HistoriqueScreen() {
  const [notifications, setNotifications] = useState<
    Array<{ video: string; timestamp: string }>
  >([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/notifications`, {
        params: { token: TOKEN },
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.log('Erreur lors de la récupération des notifications', error);
      Alert.alert('Erreur', "Impossible de récupérer l'historique.");
    }
  };

  const handleDeleteNotification = async (videoId: string) => {
    try {
      await axios.delete(`${BASE_URL}/notifications/${videoId}`, {
        params: { token: TOKEN },
      });
      Alert.alert('Supprimé', 'La notification a été supprimée.');
      fetchNotifications();
    } catch (error) {
      console.log('Erreur lors de la suppression', error);
      Alert.alert('Erreur', "Impossible de supprimer la notification.");
    }
  };

  const renderNotification = ({
    item,
  }: {
    item: { video: string; timestamp: string };
  }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationText}>{item.timestamp}</Text>
      <View style={styles.notificationButtons}>
        <Button
          title="Voir"
          onPress={() => {
            setSelectedVideo(item.video);
            setVideoModalVisible(true);
          }}
        />
        <Button
          title="Supprimer"
          onPress={() => handleDeleteNotification(item.video)}
        />
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/background-1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView
        style={[
          styles.container,
          Platform.OS === 'android' && { paddingTop: StatusBar.currentHeight },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique des notifications</Text>
          <Ionicons
            name="refresh"
            size={24}
            color="#007AFF"
            onPress={fetchNotifications}
            style={{ marginRight: 10 }}
          />
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.video}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun historique</Text>
          }
        />

        <Modal
          visible={videoModalVisible}
          animationType="slide"
          onRequestClose={() => setVideoModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Vidéo du{' '}
              {notifications.find((n) => n.video === selectedVideo)?.timestamp}
            </Text>
            {selectedVideo && (
              <Video
                source={{
                  uri: `${BASE_URL}/get_video?token=${TOKEN}&video=${selectedVideo}`,
                }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
                isLooping={false}
              />
            )}
            <Button title="Fermer" onPress={() => setVideoModalVisible(false)} />
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // laisse transparaître l'image
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 30,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100,
  },
  notificationItem: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)', // semi-opaque pour lisibilité
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    fontSize: 16,
  },
  notificationButtons: {
    flexDirection: 'row',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '500',
  },
  video: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
});
