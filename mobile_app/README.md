# 📱 Facilock — Application Mobile

> **Contrôlez votre serrure connectée depuis votre smartphone.**  
> L’application mobile Facilock permet de piloter le système de verrouillage intelligent développé sur Raspberry Pi : ouverture à distance, alertes en temps réel et gestion des accès.

---

## 🎯 Objectifs de l’application

- 🔓 **Déverrouiller / verrouiller** la porte à distance via une API REST.
- 🚨 **Recevoir des notifications** lorsqu’une personne non reconnue est détectée.
- 👤 **Consulter la liste des utilisateurs autorisés**.
- 🧩 Interface simple et moderne, adaptée au projet **Facilock** (sécurité connectée via Raspberry Pi).

---

## 🧠 Fonctionnement général

L’application communique avec le **serveur Flask** du Raspberry Pi à travers une **API REST sécurisée**.

**Principales routes API utilisées :**
| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| `POST` | `/door/open` | Ouvre la serrure |
| `GET` | `/notifications` | Récupère les notifications en attente |
| `DELETE` | `/notifications` | Supprime les notifications |
| `GET` | `/persons` | Liste les utilisateurs enregistrés |
| `POST` | `/persons` | Ajoute un nouveau visage |

---
## 🧰 Technologies utilisées

| Domaine | Outils / Langages |
|----------|-------------------|
| **Framework mobile** | React Native / Expo |
| **Communication** | API REST (HTTP / JSON) |
| **Notifications** | Firebase Cloud Messaging *(ou via Flask si local)* |
| **Design** | Material Design, minimal et clair |

---

## 🧭 Fonctionnalités principales

### 🔐 Ouverture de la porte
- Bouton central « 🔓 Déverrouiller »
- Appel du endpoint `/door/open`
- Animation d’état (ouvert / fermé)

### 🚨 Notifications
- Réception d’une alerte si un visage inconnu est détecté.
- Historique des alertes accessible dans l’application.

### 👤 Gestion des utilisateurs
- Liste des personnes autorisées
- Possibilité d’ajouter ou supprimer un utilisateur depuis l’app (selon droits)

### ⚙️ Paramètres
- Configuration de l’adresse IP / API du serveur Flask.
- Mode clair / sombre.

---

## Aperçu de l’application

<p align="center">
  <img src="/docs/design_app.png" alt="Design de l'application mobile">
</p>

---

## 🚀 Installation




###  ⚙️ Configuration :
- Modifier les variables 'BASE_URL' et 'TOKEN' de les fichiers 'authorized.tsx', 'historique.tsx' et 'index.tsx' dans '/app/(tabs)/'
