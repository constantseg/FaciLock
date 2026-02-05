# 🔒 FaciLock — Smart Connected Locking System

<p align="center">
  <img src="docs/banniere-facilock.png" alt="FaciLock Banner">
</p>

> A modern security system based on **facial recognition**, **mobile control**, and **Raspberry Pi embedded modules**.

---
### 🗒️ NOTE - This project was completed in June 2025 during my Digital Systems vocational baccalaureate. It was built with the tools and knowledge I had at the time.
### ⚠️ This project is no longer maintained.

## 🌟 Project at a Glance

**FaciLock** is a smart security system that combines:
- **Facial recognition** to authenticate users,
- A **keypad** and a **physical button** for manual control,
- A **mobile application** for remote management and alerts,
- And several **hardware modules** for interactivity (screen, sound, etc.).

---

## 🎯 Project Goals

- 🔍 Automatically identify authorized users through **facial recognition**.
- 🔘 Enable **manual control** via a button or keypad.
- 📱 **Real-time notifications** sent to the user in case of denied access.
- 🔑 **Manage and control access** directly from the mobile app.
- 🧩 Integrated modules to enhance the system:
  - 🎵 **DFPlayer Mini** for sound effects
  - 🖥️ **LCD Screen** for status display
  - 🔢 **Arduino** for keypad management

---

## 🧠 Project Description

**FaciLock** was developed on a **Raspberry Pi 5 (8 GB)** to provide a secure and connected locking solution.

### 🔄 General Workflow
1. The system stays in standby mode, displaying a home screen.
2. When a **visitor presses the button**, the camera activates.
3. The system runs **facial recognition** for a few seconds.
4. ✅ If an authorized face is recognized → **Unlock + success notification**.
5. ❌ Otherwise → **Failure notification** (including video capture) sent to the mobile app.
6. ⏱️ After a period of inactivity, the system automatically returns to the home screen.

---

### 🧭 Backend Algorithm Diagram

<p align="center">
  <img src="docs/schema-simplifier-algorithme-backend.png" width="700" alt="Simplified Backend Algorithm Diagram">
</p>

---

## ⚙️ Technologies Used

### 🧩 Backend (Raspberry Pi)

- **Language:** Python
- **Main Libraries:**
  - `face_recognition`
  - `opencv-python`
  - `flask`
  - `gpiozero`
  - `pyserial`
  - `requests`
- **Flask REST API:**

| Method | Endpoint | Description |
|----------|-----------|-------------|
| `POST` | `/unlock` | Manually unlocks the door |
| `GET` | `/notifications` | Lists captured videos of unknown visitors |
| `DELETE` | `/notifications/<video_id>` | Deletes a video/notification |
| `GET` | `/authorized` | Lists authorized persons |
| `POST` | `/authorized` | Adds a person with images (base64) |
| `PUT` | `/authorized/<old_name>` | Renames a person |
| `DELETE` | `/authorized/<name>` | Deletes a person |
| `GET` | `/authorized/<name>/images` | Lists images associated with a face |
| `GET` | `/authorized/<name>/image` | Retrieves a specific image |
| `DELETE` | `/authorized/<name>/image` | Deletes a specific image |
| `POST` | `/authorized_capture` | Captures images directly from the camera |
| `POST` | `/api/register_push_token` | Registers an Expo push token |
| `GET` | `/stream` | Real-time lock status (`lock_status`) via SSE |

> All routes require a **security token**:  
> `?token=afsfr-356hytjdhiy-huy5429876njyu-y-gfdrsertgry`

📘 See full details → [`backend/raspberrypi/README.md`](backend/raspberrypi/README.md)

---

### 📲 Mobile App

- Remote lock control
- Push notification reception (via Expo)
- Intuitive and clean UI
- Direct communication with the Raspberry Pi Flask server

📘 See mobile app → [`mobile_app/README.md`](mobile_app/README.md)

---

### 🧱 Hardware Modules

| Module | Role |
|---------|------|
| **Raspberry Pi 5** | System Central Unit |
| **Infrared Camera** | Facial Recognition |
| **3.5” Screen** | Main User Interface |
| **Push Button** | Triggers recognition |
| **Arduino** | Keypad management |
| **DFPlayer Mini** | Sound effects (Locking/Unlocking) |

---

### 🔌 Simplified Wiring Diagram

<p align="center">
  <img src="docs/Schema-cablage-simple.png" width="700" alt="Simplified System Wiring Diagram">
</p>

---

## 📁 Project Structure
