# FaciLock - Système de verrouillage connecté intelligent

> **« La clé, c’est vous. »**  
> Un système de sécurité moderne basé sur la reconnaissance faciale, le contrôle mobile et des modules embarqués sur Raspberry Pi.

---

## 🎯 Objectifs du projet

- 🔍 Utiliser la **reconnaissance faciale** pour identifier les utilisateurs autorisés.  
- 🔘 **Contrôler l’ouverture manuellement** via un bouton ou un digicode.  
- 📱 **Être alerté en temps réel** via une **application mobile**.  
- 🔑 **Contrôler l’accès à distance** depuis cette application.  
- 🧩 Ajouter des modules comme :
  - 🎵 DFPlayer Mini (effets sonores)
  - 🖥️ Écran LCD pour messages d’état
  - 🔢 Digicode (Arduino relié au Pi)

---

## 🧠 Description du projet

**Facilock** est un projet de sécurité connecté développé sur un **Raspberry Pi 5 (8 Go)**.  
Il combine plusieurs technologies pour créer une solution de verrouillage moderne, flexible et sécurisée.

Le système :
1. Attend un signal du bouton poussoir.
2. Lance la reconnaissance faciale pendant quelques secondes.
3. Si le visage est reconnu → ouverture du verrou + notification.
4. Sinon → notification d’échec envoyée à l’application mobile.
5. Après un délai sans action, retour à l’écran d'accueil.

###Schéma plus représentatif de l'algorithme
![Schéma de l'algorithme](docs/schema-simplifier-algorithme-backend.png)

---

## ⚙️ Technologies utilisées

### 🧩 Backend (Raspberry Pi)
- **Langage :** Python  
- **Librairies principales :**
  - `face_recognition`
  - `opencv-python`
  - `flask`
  - `gpiozero`
- **API REST Flask :**
  - `POST /door/open` → ouvrir la porte  
  - `GET /notifications` → récupérer les alertes  
  - `DELETE /notifications` → effacer les alertes  
  - `GET /persons` → lister les utilisateurs  
  - `POST /persons` → ajouter un visage  
  - `DELETE /persons/{id}` → supprimer un visage  

### 📲 Application mobile
- Contrôle du verrou à distance  
- Réception des notifications  
- Interface simple et intuitive
  
### 🧱 Modules matériels
| Module | Rôle |
|---------|------|
| Raspberry Pi 5 | Unité centrale du système |
| Caméra | Reconnaissance faciale |
| Écran 3.5” | Interface utilisateur |
| Bouton poussoir | Déclencheur principal |
| Arduino | Gestion du digicode |
| DFPlayer Mini | Sons d’ouverture / fermeture |

---
### Schéma simplifié du câblage
![Schéma simplifié du câblage](docs/Schema-cablage-simple.png)





