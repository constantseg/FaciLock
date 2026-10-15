# FaciLock — Backend Raspberry Pi

Programme principal de FaciLock. Il tourne sur le Raspberry Pi et regroupe :

- la reconnaissance faciale (`face_recognition` + OpenCV, modèle HOG) ;
- la commande du relais et la lecture du bouton (gpiozero) ;
- la communication série avec l'Arduino du digicode ;
- l'interface affichée sur l'écran 3,5" (OpenCV, 480x320) ;
- l'API REST Flask utilisée par l'application mobile ;
- l'envoi des notifications push via l'API Expo.

## Prérequis

- Raspberry Pi avec Python 3 et une caméra
- `ffmpeg` (conversion des vidéos de visiteurs)
- Les outils de compilation de `dlib` (`cmake`, `build-essential`), dont dépend `face_recognition`
- Un Arduino flashé avec un des sketches de [`../arduino`](../arduino), branché en USB

## Installation

```bash
git clone https://github.com/ConstantSeg/FaciLock.git
cd FaciLock/backend/raspberrypi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Les paramètres se trouvent en haut de `app.py` :

| Constante | Valeur par défaut | Rôle |
|-----------|-------------------|------|
| `VIDEO_TOKEN` | — | Jeton exigé par toutes les routes de l'API. **À changer.** |
| `RELAY_PIN` | `16` | GPIO du relais |
| `BUTTON_PIN` | `26` | GPIO du bouton |
| `SERIAL_PORT` | `/dev/ttyACM0` | Port série de l'Arduino |
| `SERIAL_BAUDRATE` | `9600` | Vitesse de la liaison série |
| `SECRET_CODE` | `1234` | Code du digicode |
| `MODEL` | `hog` | Modèle de détection de `face_recognition` |

### Ajouter une personne autorisée

Créer un dossier à son nom dans `tetes/` et y placer une ou plusieurs photos du visage :

```
tetes/
└── constant/
    └── exemple.jpg
```

On peut aussi passer par l'application mobile ou par les routes `/authorized` et `/authorized_capture`.

## Lancement

```bash
python app.py
```

L'API est accessible sur `http://<ip-du-pi>:5000`.

## API

Toutes les routes attendent le paramètre `?token=<VIDEO_TOKEN>`.

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/unlock` | Déverrouille la porte |
| `GET` | `/stream` | État du verrou en temps réel (SSE, événement `status`) |
| `GET` | `/notifications` | Liste les vidéos des visiteurs inconnus |
| `DELETE` | `/notifications/<video_id>` | Supprime une vidéo |
| `GET` | `/get_video?video=<nom>` | Télécharge une vidéo |
| `GET` | `/authorized` | Liste les personnes autorisées |
| `POST` | `/authorized` | Ajoute une personne à partir d'images en base64 |
| `PUT` | `/authorized/<old_name>` | Renomme le dossier d'une personne |
| `DELETE` | `/authorized/<name>` | Supprime une personne |
| `GET` | `/authorized/<name>/images` | Liste les images d'une personne |
| `GET` | `/authorized/<name>/image?filename=<fichier>` | Récupère une image |
| `DELETE` | `/authorized/<name>/image?filename=<fichier>` | Supprime une image |
| `POST` | `/authorized_capture` | Prend des photos avec la caméra du Pi |
| `POST` | `/api/register_push_token` | Enregistre un jeton Expo (stocké dans `expo_tokens.json`) |

## Visiteurs inconnus

Quand aucun visage n'est reconnu :

1. une courte vidéo `unknown_<timestamp>.mp4` est enregistrée dans `captured_videos/` ;
2. elle est réencodée avec `ffmpeg` pour être lisible sur mobile (`visitor_fixed_...`) ;
3. une notification « Visiteur inconnu » est envoyée à tous les jetons Expo enregistrés.

## Commandes envoyées à l'Arduino

Le Pi envoie un caractère sur la liaison série pour indiquer l'état à afficher sur le LCD :

| Code | Signification |
|------|---------------|
| `W` | Accueil |
| `R` | Reconnaissance en cours |
| `U` | Déverrouillage par reconnaissance |
| `A` | Verrouillage automatique |
| `N` | Visiteur non reconnu |
| `L` | Déverrouillage manuel |
| `M` | Verrouillage manuel |
| `C` | Code correct |
| `I` | Code incorrect |
| `B` | Sonnette |

## Câblage

| Élément | Connexion |
|---------|-----------|
| Relais | GPIO 16 |
| Bouton poussoir | GPIO 26 |
| Arduino | USB (`/dev/ttyACM0`) |
| Caméra | Port caméra du Pi |
| Écran 3,5" | GPIO / HDMI selon le modèle |

## Arborescence

```
raspberrypi/
├── app.py                # Programme principal
├── requirements.txt
├── icon/                 # Icônes de l'interface locale
├── tetes/                # Visages autorisés (un dossier par personne)
├── captured_videos/      # Vidéos des visiteurs inconnus
└── expo_tokens.json      # Jetons de notification enregistrés
```
