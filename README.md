# 🔒 FaciLock — Système de verrouillage connecté intelligent

<p align="center">
  <img src="docs/banniere-facilock.png" alt="Bannière FaciLock">
</p>

> Un système de sécurité moderne basé sur la **reconnaissance faciale**, le **contrôle mobile** et des **modules embarqués sur Raspberry Pi**.

---

## 🌟 Projet en un coup d’œil

**FaciLock** est un système de sécurité intelligent qui combine :
- la **reconnaissance faciale** pour authentifier les utilisateurs,
- un **digicode** et un **bouton physique** pour le contrôle manuel,
- une **application mobile** pour le pilotage à distance et les alertes,
- et plusieurs **modules matériels** pour l’interactivité (écran, son, etc.).

---

## 🎯 Objectifs du projet

- 🔍 Identifier automatiquement les utilisateurs autorisés grâce à la **reconnaissance faciale**.  
- 🔘 Permettre un **contrôle manuel** via un bouton ou un digicode.  
- 📱 **Notifier en temps réel** l’utilisateur en cas d’accès refusé.  
- 🔑 **Contrôler et gérer l’accès** directement depuis l’application mobile.  
- 🧩 Ajouter des modules pour enrichir le système :
  - 🎵 **DFPlayer Mini** pour les effets sonores
  - 🖥️ **Écran LCD** pour l’affichage d’informations
  - 🔢 **Arduino** pour la gestion du digicode

---

## 🧠 Description du projet

**FaciLock** a été conçu sur un **Raspberry Pi 5 (8 Go)** pour offrir une solution de verrouillage connectée et sécurisée.

### 🔄 Fonctionnement général
1. Le système est en veille et affiche un écran d’accueil.  
2. Lorsqu’un **visiteur appuie sur le bouton**, la caméra s’active.  
3. Le système lance la **reconnaissance faciale** pendant quelques secondes.  
4. ✅ Si un visage autorisé est reconnu → **déverrouillage + notification de succès**.  
5. ❌ Sinon → **notification d’échec** envoyée à l’application mobile.  
6. ⏱️ Après un délai sans action, le système revient automatiquement à l’accueil.

---

### 🧭 Schéma de l’algorithme du backend

<p align="center">
  <img src="docs/schema-simplifier-algorithme-backend.png" width="700" alt="Schéma simplifié de l'algorithme du backend">
</p>

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

📘 Voir le backend complet ici → [`backend/README.md`](backend/README.md)

---

### 📲 Application mobile
- Contrôle du verrou à distance  
- Réception des notifications  
- Interface simple, claire et réactive  
- Connexion sécurisée à l’API Flask du Raspberry Pi  

📘 Voir l’app mobile ici → [`mobile_app/README.md`](mobile_app/README.md)

---

### 🧱 Modules matériels

| Module | Rôle |
|---------|------|
| **Raspberry Pi 5** | Unité centrale du système |
| **Caméra infrarouge** | Reconnaissance faciale |
| **Écran 3.5”** | Interface utilisateur principale |
| **Bouton poussoir** | Déclenchement de la reconnaissance |
| **Arduino** | Gestion du digicode |
| **DFPlayer Mini** | Effets sonores (verrouillage/déverrouillage) |

---

### 🔌 Schéma simplifié du câblage

<p align="center">
  <img src="docs/Schema-cablage-simple.png" width="700" alt="Schéma simplifié du câblage du système">
</p>

---

## 📁 Arborescence du projet

```
FaciLock/
├── backend/              # Serveur Flask + reconnaissance faciale
│   ├── app.py
│   ├── icon/
│   ├── tetes/
│   └── requirements.txt
├── mobile_app/           # Application mobile (Flutter ou React Native)
│   ├── lib/
│   └── pubspec.yaml
├── docs/                 # Images, schémas, ressources
│   ├── banniere-facilock.png
│   ├── schema-simplifier-algorithme-backend.png
│   └── Schema-cablage-simple.png
└── README.md             # Présentation du projet
```

---

## 👤 Auteur

**Constant Segretain**  
🎓 Élève en **Bac Pro SN** — futur **BTS SIO SISR (Cybersécurité)**  
📅 Année : 2025  
📫 [constantsegretain@gmail.com](mailto:constantsegretain@gmail.com)  
🌐 [github.com/constantsegretain@gmail.com](https://github.com/constantsegretain@gmail.com)

---

> _« Un projet mêlant sécurité, intelligence et innovation — la clé, c’est vous. »_
