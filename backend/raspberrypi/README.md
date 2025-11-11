# 🧠 Facilock — Backend Python (Flask + Reconnaissance Faciale)

> Serveur central du système **Facilock**, gérant la reconnaissance faciale, les interactions matérielles (bouton, relais, digicode, écran LCD) et la communication avec l’application mobile via API REST et notifications push.

---

## 🚀 Fonctionnalités principales

- 🔍 **Reconnaissance faciale** via `face_recognition` et `OpenCV`.
- 🔐 **Contrôle du verrou** (relais GPIO + bouton physique).
- 🔢 **Digicode** géré via liaison série (Arduino).
- 🧠 **Serveur Flask** exposant une **API REST sécurisée**.
- 📲 **Notifications push** envoyées à l’application mobile (Expo/React Native).
- 🎥 **Capture vidéo automatique** lors d’une détection d’intrus.
- 🖥️ **Affichage visuel** sur écran 3.5" (interface OpenCV avec icônes interactives).

---

## ⚙️ Technologies utilisées

| Domaine | Outils / Librairies |
|----------|---------------------|
| **Langage** | Python 3 |
| **Serveur web** | Flask + Flask-CORS |
| **Vision** | OpenCV, face_recognition |
| **Matériel** | gpiozero, pyserial |
| **Notifications** | Expo Push API |
| **Asynchrone** | threading |
| **Système** | Raspberry Pi 5 (8 Go), caméra infrarouge, relais, Arduino |

---

## 🧩 Schéma de fonctionnement

1. Le système démarre et affiche un écran d’accueil avec l’état du verrou.  
2. Lorsqu’un **visiteur appuie sur le bouton**, la caméra s’active pour une durée limitée.  
3. Le **visage** est comparé à la base locale `tetes/` :
   - ✅ Si reconnu → ouverture + message LCD + retour à l’accueil.  
   - ❌ Si inconnu → enregistrement d’une vidéo, notification push, affichage d’un message d’alerte.  
4. Le système se reverrouille automatiquement après quelques secondes.

---

## 📡 API REST

| Méthode | Endpoint | Description |
|----------|-----------|-------------|
| `POST` | `/unlock` | Ouvre manuellement le verrou |
| `GET` | `/notifications` | Liste les vidéos capturées (visiteurs inconnus) |
| `DELETE` | `/notifications/<id>` | Supprime une notification vidéo |
| `GET` | `/authorized` | Liste des personnes autorisées |
| `POST` | `/authorized` | Ajout d’une personne (via images base64) |
| `PUT` | `/authorized/<old_name>` | Renommage d’un dossier de visage |
| `DELETE` | `/authorized/<name>` | Suppression d’une personne |
| `GET` | `/authorized/<name>/images` | Liste les images associées à un visage |
| `GET` | `/authorized/<name>/image` | Télécharge une image précise |
| `DELETE` | `/authorized/<name>/image` | Supprime une image |
| `POST` | `/authorized_capture` | Capture directe depuis la caméra |
| `POST` | `/api/register_push_token` | Enregistre un token Expo pour notifications |
| `GET` | `/stream` | Stream d’événements SSE (`lock_status` en temps réel) |

> Toutes les routes nécessitent un **token de sécurité** :  
> `?token=afsfr-356hytjdhiy-huy5429876njyu-y-gfdrsertgry`

---

## 🧱 Structure du dossier

```
raspberrypi/
├── app.py                     # Script principal
├── icon/                      # Icônes affichées à l'écran
│   ├── locked.png
│   ├── unlocked.png
│   ├── camera.png
│   ├── close.png
│   └── ...
├── tetes/                     # Dossiers des visages enregistrés
│   ├── Constant/
│   ├── Ami/
│   └── ...
├── captured_videos/           # Vidéos enregistrées des visiteurs inconnus
├── expo_tokens.json           # Liste des tokens de notification Expo
├── requirements.txt           # Dépendances Python
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Cloner le dépôt
```bash
git clone https://github.com/ConstantSegretain/Facilock.git
cd backend
```

### 2️⃣ Installer les dépendances
> Active ton environnement virtuel avant si tu en utilises un.
```bash
pip install -r requirements.txt
```

**Contenu de `requirements.txt` :**
```
flask
flask-cors
requests
opencv-python
face_recognition
gpiozero
pyserial
numpy
```

---

### 3️⃣ Lancer le backend
```bash
python app.py
```

📍 Le serveur écoute sur `http://0.0.0.0:5000`.

---

## 🧠 Interaction matérielle

| Élément | Rôle |
|----------|------|
| **Bouton poussoir** | Déclenche la reconnaissance faciale |
| **Relais** | Commande le verrou (GPIO16) |
| **Arduino** | Gère le digicode et l’écran LCD (UART `/dev/ttyACM0`) |
| **Caméra** | Capture des visages et vidéos |
| **Écran 3.5"** | Interface utilisateur (affichage OpenCV) |

---

## 🧩 Commandes pour LCD (envoyé à Arduino)

| Code | Action |
|------|--------|
| `W` | Message d’accueil |
| `R` | Reconnaissance en cours |
| `U` | Déverrouillage réussi |
| `A` | Verrouillage automatique |
| `N` | Visiteur non reconnu |
| `L` | Déverrouillage manuel |
| `M` | Verrouillage manuel |
| `C` | Code correct |
| `I` | Code incorrect |
| `B` | Sonnerie détectée |

---

## 🧾 Notifications push

L’application mobile enregistre son **token Expo** via `/api/register_push_token`.  
Lorsqu’un visage inconnu est détecté, le backend envoie automatiquement une **notification push** :

```python
send_notification_async("Facilock", "Visiteur inconnu")
```

---

## 🧩 Détection et capture

Lorsqu’aucun visage n’est reconnu :
- Une courte vidéo (`unknown_TIMESTAMP.mp4`) est enregistrée.
- Elle est ensuite convertie en MP4 compatible (`visitor_fixed_...`) via `ffmpeg`.
- Une alerte est envoyée à l’app mobile.

---

## 🧠 Auteur

**Constant Segretain**  
🎓 Étudiant BTS SIO SISR 
📅 Année : 2025  
📫 [constantsegretain@gmail.com](mailto:constantsegretain@gmail.com)  
🌐 [github.com/ConstantSeg](https://github.com/ConstantSeg)

---

> _« Un backend intelligent pour un verrou intelligent — la clé, c’est vous. »_
