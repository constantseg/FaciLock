// AuthorizedScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ImageBackground, // <-- ajouté
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = 'https://app.exemple.com';
const TOKEN = 'CHANGEME';

export default function AuthorizedScreen() {
  const [authorized, setAuthorized] = useState<string[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedAuthorized, setSelectedAuthorized] = useState<string | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [captureModalVisible, setCaptureModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loadingCapture, setLoadingCapture] = useState(false);

  useEffect(() => {
    fetchAuthorized();
  }, []);

  const fetchAuthorized = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/authorized`, { params: { token: TOKEN } });
      setAuthorized(response.data.authorized);
    } catch (error) {
      console.log("Erreur lors de la récupération", error);
      Alert.alert("Erreur", "Impossible de récupérer la liste des personnes autorisées.");
    }
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom.");
      return;
    }
    try {
      await axios.post(
        `${BASE_URL}/authorized`,
        { name: newPersonName, images: [] },
        { params: { token: TOKEN } }
      );
      Alert.alert("Succès", "La personne a été ajoutée.");
      setNewPersonName('');
      fetchAuthorized();
    } catch (error) {
      console.log("Erreur lors de l'ajout", error);
      Alert.alert("Erreur", "Impossible d'ajouter la personne.");
    }
  };

  const openDetails = (name: string) => {
    setSelectedAuthorized(name);
    setNewName(name);
    setDetailsModalVisible(true);
    fetchImages(name);
  };

  const fetchImages = async (name: string) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/authorized/${name}/images`,
        { params: { token: TOKEN } }
      );
      setImages(response.data.images);
    } catch (error) {
      console.log("Erreur lors de la récupération des images", error);
      Alert.alert("Erreur", "Impossible de récupérer les images pour cette personne.");
    }
  };

  const handleUpdateName = async () => {
    if (!selectedAuthorized) return;
    if (!newName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/authorized/${selectedAuthorized}`,
        { new_name: newName },
        { params: { token: TOKEN } }
      );
      Alert.alert("Succès", "Nom modifié.");
      setDetailsModalVisible(false);
      fetchAuthorized();
    } catch (error) {
      console.log("Erreur lors de la modification", error);
      Alert.alert("Erreur", "Impossible de modifier le nom.");
    }
  };

  const handleCapturePhoto = async () => {
    if (!selectedAuthorized) return;
    setLoadingCapture(true);
    try {
      await axios.post(
        `${BASE_URL}/authorized_capture`,
        { name: selectedAuthorized, num_images: 1, delay: 0 },
        { params: { token: TOKEN } }
      );
      Alert.alert("Succès", "Photo ajoutée.");
      fetchImages(selectedAuthorized);
    } catch (error) {
      console.log("Erreur lors de la capture", error);
      Alert.alert("Erreur", "Impossible de capturer une photo.");
    }
    setLoadingCapture(false);
  };

  const handleDeleteAuthorized = async (name: string) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer cette personne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `${BASE_URL}/authorized/${name}`,
                { params: { token: TOKEN } }
              );
              Alert.alert("Supprimé", "La personne a été supprimée.");
              fetchAuthorized();
            } catch (error) {
              console.log("Erreur lors de la suppression", error);
              Alert.alert("Erreur", "Impossible de supprimer la personne.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteImage = async (filename: string) => {
    if (!selectedAuthorized) return;
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer cette photo ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(
                `${BASE_URL}/authorized/${selectedAuthorized}/image`,
                { params: { token: TOKEN, filename } }
              );
              Alert.alert("Supprimé", "La photo a été supprimée.");
              fetchImages(selectedAuthorized);
            } catch (error) {
              console.log("Erreur lors de la suppression de la photo", error);
              Alert.alert("Erreur", "Impossible de supprimer la photo.");
            }
          },
        },
      ]
    );
  };

  const renderPerson = ({ item }: { item: string }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item}</Text>
      <View style={styles.itemButtons}>
        <Button title="Détails" onPress={() => openDetails(item)} />
        <TouchableOpacity onPress={() => handleDeleteAuthorized(item)}>
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImage = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{
          uri: `${BASE_URL}/authorized/${selectedAuthorized}/image?token=${TOKEN}&filename=${item}`,
        }}
        style={styles.image}
      />
      <TouchableOpacity
        style={styles.deleteIcon}
        onPress={() => handleDeleteImage(item)}
      >
        <Ionicons name="trash" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/background-1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Ajout d’une personne */}
          <View style={styles.addPersonContainer}>
            <Text style={styles.headerTitle}>Ajouter une personne</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de la nouvelle personne"
              placeholderTextColor="#999"
              value={newPersonName}
              onChangeText={setNewPersonName}
            />
            <Button title="Ajouter" onPress={addPerson} />
            <Text style={styles.sectionTitle}>Liste des personnes autorisées</Text>
          </View>

          <FlatList
            data={authorized}
            keyExtractor={(item) => item}
            renderItem={renderPerson}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.listContainer}
          />

          {/* Modal détails personne */}
          <Modal
            visible={detailsModalVisible}
            animationType="slide"
            onRequestClose={() => setDetailsModalVisible(false)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  Détails pour {selectedAuthorized}
                </Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  placeholder="Modifier le nom"
                  placeholderTextColor="#999"
                  onChangeText={setNewName}
                />
                <View style={styles.modalButtons}>
                  <Button title="Modifier" onPress={handleUpdateName} />
                  <Button
                    title="Capturer photo"
                    onPress={() => setCaptureModalVisible(true)}
                    disabled={loadingCapture}
                  />
                </View>
                <Text style={styles.sectionTitle}>Galerie</Text>
                <FlatList
                  data={images}
                  keyExtractor={(item) => item}
                  horizontal
                  renderItem={renderImage}
                />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Fermer"
                    onPress={() => setDetailsModalVisible(false)}
                  />
                </View>
              </View>
            </SafeAreaView>
          </Modal>

          {/* Modal capture manuelle */}
          <Modal
            visible={captureModalVisible}
            animationType="slide"
            onRequestClose={() => setCaptureModalVisible(false)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  Capture pour {selectedAuthorized}
                </Text>
                <Button
                  title="Prendre une photo"
                  onPress={handleCapturePhoto}
                  disabled={loadingCapture}
                />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Terminer"
                    onPress={() => setCaptureModalVisible(false)}
                  />
                </View>
              </View>
            </SafeAreaView>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  addPersonContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 30,
    color: '#000',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontSize: 20,
    marginVertical: 10,
    textAlign: 'center',
    color: '#000',
  },
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 5,
    marginBottom: 5,
  },
  itemText: {
    fontSize: 18,
    color: '#000',
  },
  itemButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  deleteIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 2,
  },
});
