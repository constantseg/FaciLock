<p align="center">
  <a href="README.md">Français</a> | <b>English</b>
</p>

# FaciLock

<p align="center">
  <img src="docs/banniere-facilock.png" alt="FaciLock banner">
</p>

A facial-recognition door lock built around a Raspberry Pi 5, an Arduino (keypad, LCD, sound) and a React Native mobile app.

> [!NOTE]
> Built in June 2025 for my vocational baccalaureate in Digital Systems, with the tools and knowledge I had at the time. The project is no longer maintained.

## Contents

- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Hardware](#hardware)
- [API](#api)
- [Repository layout](#repository-layout)
- [Demo](#demo)
- [Authors](#authors)

## How it works

The door can be opened three ways: facial recognition, a code on the keypad, or remotely from the mobile app.

1. When idle, the Raspberry Pi shows a home screen with the lock status.
2. Pressing the button turns the camera on for a few seconds.
3. The captured face is compared against the faces stored in `tetes/`.
4. If it matches, the relay unlocks the door and a message is shown on the LCD.
5. Otherwise, a short video of the visitor is recorded and a push notification is sent to the phone.
6. The door locks again automatically and the system goes back to the home screen.

<p align="center">
  <img src="docs/schema-simplifier-algorithme-backend.png" width="700" alt="Simplified backend flow">
</p>

## Architecture

| Part | Role | Stack |
|------|------|-------|
| [`backend/raspberrypi`](backend/raspberrypi/README.md) | Face recognition, relay and button control, REST API, notifications | Python, Flask, OpenCV, face_recognition, gpiozero, pyserial |
| [`backend/arduino`](backend/arduino) | 4x4 keypad, I2C LCD, DFPlayer Mini audio | C++ (Arduino) |
| [`mobile_app`](mobile_app/README.md) | Remote unlock, unknown-visitor history, authorized faces management | React Native, Expo |

The Raspberry Pi talks to the Arduino over a USB serial link. The mobile app calls the Flask API over HTTP and receives lock status updates through Server-Sent Events.

## Hardware

| Component | Purpose |
|-----------|---------|
| Raspberry Pi 5 (8 GB) | Main controller |
| Infrared camera | Face capture |
| 3.5" display | Local interface |
| Push button | Starts recognition |
| Relay | Drives the door strike |
| Arduino + 4x4 keypad + 16x2 LCD | Keypad entry |
| DFPlayer Mini | Lock / unlock sounds |

<p align="center">
  <img src="docs/Schema-cablage-simple.png" width="700" alt="Simplified wiring diagram">
</p>

## API

The Flask server listens on port `5000`. Every request must pass the token defined in `VIDEO_TOKEN` (`app.py`) as the `?token=` query parameter.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/unlock` | Unlocks the door |
| `GET` | `/stream` | Live lock status (SSE) |
| `GET` | `/notifications` | Lists unknown-visitor videos |
| `DELETE` | `/notifications/<video_id>` | Deletes a video |
| `GET` | `/get_video` | Downloads a video |
| `GET` | `/authorized` | Lists authorized people |
| `POST` | `/authorized` | Adds a person (base64 images) |
| `PUT` | `/authorized/<old_name>` | Renames a person |
| `DELETE` | `/authorized/<name>` | Removes a person |
| `GET` | `/authorized/<name>/images` | Lists a person's images |
| `GET` | `/authorized/<name>/image` | Fetches one image |
| `DELETE` | `/authorized/<name>/image` | Deletes one image |
| `POST` | `/authorized_capture` | Takes photos with the Pi camera |
| `POST` | `/api/register_push_token` | Registers an Expo push token |

Setup and details (in French): [`backend/raspberrypi/README.md`](backend/raspberrypi/README.md).

## Repository layout

```
FaciLock/
├── backend/
│   ├── arduino/              # Keypad sketches (with or without LCD / audio)
│   └── raspberrypi/          # Flask server and face recognition
│       ├── app.py
│       ├── icon/             # Local UI icons
│       ├── tetes/            # One image folder per authorized person
│       └── requirements.txt
├── mobile_app/               # React Native app (Expo)
└── docs/                     # Diagrams and images
```

## Demo

<p align="center">
  <img src="docs/ecran-raspberry.png" width="400" alt="Raspberry Pi screen">
</p>

https://github.com/user-attachments/assets/030c9b42-d527-4f9c-b894-ffae5ed32931

https://github.com/user-attachments/assets/c78db34c-b6a0-4d19-991c-1e6d8f9cd817

https://github.com/user-attachments/assets/aa9d5f4c-af0a-4c98-b0aa-f1e18a58ad64

## Authors

- **Constant Segrétain**: software (backend, Arduino, mobile app) — [GitHub](https://github.com/ConstantSeg) · [constantsegretain@gmail.com](mailto:constantsegretain@gmail.com)
- **Tom Maudet**: wiring and physical prototype — [GitHub](https://github.com/T0myto)
