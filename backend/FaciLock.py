import os
import json
import shutil
import datetime
import time
import uuid
import threading
import requests
import cv2
import face_recognition
import serial
import numpy as np
from flask import Flask, send_file, request, jsonify, Response
from flask_cors import CORS
from gpiozero import Button, LED

def broadcast_events():
    """
    Generator SSE: émet une ligne 'event: status\ndata: {...}\n\n'
    chaque fois que `lock_status` change.
    """
    last = None
    while True:
        with lock_status_lock:
            current = lock_status
        if current != last:
            data = json.dumps({"status": current})
            yield f"event: status\ndata: {data}\n\n"
            last = current
        time.sleep(0.5)

app = Flask(__name__)

lock_status = "locked"
lock_status_lock = threading.Lock()

# --- Configuration et constantes ---
VIDEO_TOKEN        = "afsfr-356hytjdhiy-huy5429876njyu-y-gfdrsertgry"
RELAY_PIN          = 16
BUTTON_PIN         = 26
SERIAL_PORT        = '/dev/ttyACM0'
SERIAL_BAUDRATE    = 9600
SECRET_CODE        = "1234"
EXP_PUSH_URL       = "https://exp.host/--/api/v2/push/send"
TOKENS_FILE        = "expo_tokens.json"

BG_HEIGHT          = 320
BG_WIDTH           = 480
icon_size          = (150, 150)
MODEL              = 'hog'
FRAME_THICKNESS    = 3
FONT_THICKNESS     = 2
KNOWN_FACES_DIR    = 'tetes'
TOLERANCE          = 0.5
DETECTION_DURATION = 7
UNLOCK_DURATION    = 5

# --- Commandes LCD (Arduino) ---
CMD_WELCOME        = 'W'
CMD_RECON          = 'R'
CMD_UNLOCK         = 'U'
CMD_AUTOLOCK       = 'A'
CMD_NOT_RECOG      = 'N'
CMD_NOTIFY         = 'X'
CMD_MANUAL_UNLOCK  = 'L'
CMD_MANUAL_LOCK    = 'M'
CMD_CODE_CORRECT   = 'C'
CMD_CODE_INCORRECT = 'I'
CMD_RING           = 'B'

# --- Persistance des tokens Expo ---
def load_tokens():
    if os.path.exists(TOKENS_FILE):
        with open(TOKENS_FILE, "r") as f:
            return set(json.load(f))
    return set()

def save_tokens():
    with open(TOKENS_FILE, "w") as f:
        json.dump(list(registered_push_tokens), f)

registered_push_tokens = load_tokens()

# --- Initialisation matériel ---
relais = LED(RELAY_PIN, active_high=True)
relais.on()  # verrou fermé par défaut
button = Button(BUTTON_PIN)

try:
    ser = serial.Serial(SERIAL_PORT, SERIAL_BAUDRATE, timeout=0.1)
except serial.SerialException:
    ser = None

def send_cmd(cmd: str):
    if ser: ser.write(cmd.encode('utf-8'))
    print(f"[CMD] {cmd}")

def send_lcd(text: str):
    if ser: ser.write((text + "\n").encode('utf-8'))
    print(f"[LCD] {text}")

# écran d’accueil
send_cmd(CMD_WELCOME)

# --- Caméra et reconnaissance ---
capturing_in_progress = False
camera_lock           = threading.Lock()
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
code_buffer = ""

# --- Chargement des visages autorisés ---
known_faces, known_names = [], []
def load_known_faces():
    global known_faces, known_names
    known_faces, known_names = [], []
    os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
    for name in os.listdir(KNOWN_FACES_DIR):
        p = os.path.join(KNOWN_FACES_DIR, name)
        if not os.path.isdir(p): continue
        for fn in os.listdir(p):
            img = cv2.imread(os.path.join(p, fn))
            if img is None: continue
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            encs = face_recognition.face_encodings(rgb)
            if encs:
                known_faces.append(encs[0])
                known_names.append(name)
load_known_faces()

# --- Chargement des icônes OpenCV ---
def load_icon(path, size=None):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None: raise FileNotFoundError(path)
    return cv2.resize(img, size, interpolation=cv2.INTER_AREA) if size else img

locked_icon    = load_icon("icon/locked.png", icon_size)
unlocked_icon  = load_icon("icon/unlocked.png", icon_size)
camera_icon    = load_icon("icon/camera.png", icon_size)
close_icon     = load_icon("icon/close.png", (60,60))
record_icon    = load_icon("icon/recording.png", (96,96)) if os.path.exists("icon/recording.png") else None
bottom_img     = load_icon("icon/bottom.png", (BG_WIDTH,100)) if os.path.exists("icon/bottom.png") else None

enlarged_cam   = cv2.resize(camera_icon, (70,70), interpolation=cv2.INTER_AREA)
small_locked   = cv2.resize(locked_icon,   (70,70), interpolation=cv2.INTER_AREA)
small_unlocked = cv2.resize(unlocked_icon, (70,70), interpolation=cv2.INTER_AREA)

def overlay_icon(bg, icon, pos):
    x,y = pos; h,w = icon.shape[:2]
    if icon.shape[2] == 4:
        a = icon[:,:,3]/255.0
        for c in range(3):
            bg[y:y+h, x:x+w, c] = icon[:,:,c]*a + bg[y:y+h, x:x+w, c]*(1-a)
    else:
        bg[y:y+h, x:x+w] = icon

def show_home_screen():
    bg = np.full((BG_HEIGHT,BG_WIDTH,3), (81,73,26), dtype=np.uint8)
    ico = unlocked_icon if lock_status=="unlocked" else locked_icon
    cx = (BG_WIDTH - icon_size[0])//2
    cy = (BG_HEIGHT - icon_size[1])//2 - 20
    overlay_icon(bg, ico, (cx,cy))
    overlay_icon(bg, enlarged_cam, (BG_WIDTH-70-10,10))
    if bottom_img is not None:
        overlay_icon(bg, bottom_img, (0,BG_HEIGHT-100))
    cv2.imshow("Camera", bg)




@app.route("/stream")
def stream():
    token = request.args.get("token", "")
    if token != VIDEO_TOKEN:
        return ("", 403)
    return Response(
        broadcast_events(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.route("/api/register_push_token", methods=["POST"])
def api_register_push():
    tok = request.json.get("expoPushToken")
    if not tok: return jsonify({'error':"manquant"}),400
    registered_push_tokens.add(tok)
    save_tokens()
    return jsonify({'status':'ok','token':tok}),200

def _send_push(token, title, body):
    try:
        requests.post(EXP_PUSH_URL,
            json={"to":token,"title":title,"body":body,"sound":"default"},
            headers={"Content-Type":"application/json"},
            timeout=5)
    except:
        pass

def send_notification_async(title, message):
    threading.Thread(target=lambda: [_send_push(t, title, message) for t in registered_push_tokens],
                     daemon=True).start()

@app.route("/get_video")
def api_get_video():
    if request.args.get("token") != VIDEO_TOKEN:
        return "403",403
    vid = request.args.get("video","")
    p = os.path.join("captured_videos", vid)
    if os.path.exists(p):
        return send_file(p, mimetype="video/mp4", as_attachment=False,
                         download_name=vid, conditional=True)
    return "404",404

@app.route("/unlock", methods=["POST"])
def api_unlock():
    if request.args.get("token") != VIDEO_TOKEN:
        return jsonify({"error":"403"}),403
    unlock_door(manual=True)
    return jsonify({"status":"unlocked"}),200

@app.route("/notifications", methods=["GET"])
def api_list_notifications():
    if request.args.get("token") != VIDEO_TOKEN:
        return jsonify({"error":"403"}),403
    files = []
    for fn in sorted(os.listdir("captured_videos"), reverse=True):
        if fn.startswith("visitor_fixed_") and fn.endswith(".mp4"):
            t = os.path.getctime(os.path.join("captured_videos", fn))
            files.append({"video":fn,
                          "timestamp":datetime.datetime.fromtimestamp(t).strftime("%Y-%m-%d %H:%M:%S")})
    return jsonify({"notifications":files})

# … endpoints /authorized inchangés …
@app.route("/notifications/<video_id>", methods=["DELETE"])
def delete_notification(video_id):
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    path = os.path.join("captured_videos", video_id)
    if os.path.exists(path):
        os.remove(path)
        return jsonify({"status": "deleted", "video": video_id})
    return jsonify({"error": "Vidéo non trouvée"}), 404

@app.route("/authorized", methods=["GET"])
def get_authorized():
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    authorized = []
    if os.path.exists(KNOWN_FACES_DIR):
        for name in os.listdir(KNOWN_FACES_DIR):
            person_dir = os.path.join(KNOWN_FACES_DIR, name)
            if os.path.isdir(person_dir):
                authorized.append(name)
    return jsonify({"authorized": authorized})

@app.route("/authorized", methods=["POST"])
def add_authorized():
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    data = request.get_json()
    if not data or "name" not in data or "images" not in data:
        return jsonify({"error": "Données invalides, 'name' et 'images' requis"}), 400
    name = data["name"]
    images = data["images"]
    if not isinstance(images, list):
        return jsonify({"error": "'images' doit être un tableau."}), 400
    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    if not os.path.exists(person_dir):
        os.makedirs(person_dir)
    saved_files = []
    for image_data in images:
        filename = f"face_{uuid.uuid4().hex}.jpg"
        file_path = os.path.join(person_dir, filename)
        try:
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(image_data))
            saved_files.append(filename)
        except Exception as e:
            return jsonify({"error": "Erreur lors de l'enregistrement de l'image", "details": str(e)}), 500
    load_known_faces()
    return jsonify({"status": "authorized person added", "name": name, "files": saved_files})

@app.route("/authorized/<name>", methods=["DELETE"])
def delete_authorized(name):
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403

    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    if os.path.isdir(person_dir):
        # Supprime tout le dossier de la personne
        shutil.rmtree(person_dir)
        # Recharge la liste des visages connus
        load_known_faces()
        return jsonify({"status": "deleted", "name": name}), 200

    return jsonify({"error": "Personne non trouvée"}), 404

@app.route("/authorized/<old_name>", methods=["PUT"])
def update_authorized(old_name):
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    data = request.get_json()
    if not data or "new_name" not in data:
        return jsonify({"error": "Données invalides, 'new_name' requis"}), 400
    new_name = data["new_name"]
    old_dir = os.path.join(KNOWN_FACES_DIR, old_name)
    new_dir = os.path.join(KNOWN_FACES_DIR, new_name)
    if not os.path.exists(old_dir):
        return jsonify({"error": "Personne non trouvée"}), 404
    if os.path.exists(new_dir):
        return jsonify({"error": "Le nouveau nom existe déjà"}), 400
    os.rename(old_dir, new_dir)
    load_known_faces()
    return jsonify({"status": "updated", "old_name": old_name, "new_name": new_name})

@app.route("/authorized/<name>/images", methods=["GET"])
def get_authorized_images(name):
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    if not os.path.exists(person_dir):
        return jsonify({"error": "Personne non trouvée"}), 404
    images = []
    for filename in os.listdir(person_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            images.append(filename)
    return jsonify({"images": images})

@app.route("/authorized/<name>/image", methods=["GET"])
def get_authorized_image(name):
    token = request.args.get("token")
    filename = request.args.get("filename")
    if token != VIDEO_TOKEN:
        return "Accès non autorisé", 403
    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    file_path = os.path.join(person_dir, filename)
    if os.path.exists(file_path):
        return send_file(file_path, mimetype="image/jpeg")
    return "Image non trouvée", 404

@app.route("/authorized/<name>/image", methods=["DELETE"])
def delete_authorized_image(name):
    token = request.args.get("token")
    filename = request.args.get("filename")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    file_path = os.path.join(person_dir, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        load_known_faces()
        return jsonify({"status": "deleted", "filename": filename})
    return jsonify({"error": "Image non trouvée"}), 404

@app.route("/authorized_capture", methods=["POST"])
def add_authorized_capture():
    global capturing_in_progress, cap
    token = request.args.get("token")
    if token != VIDEO_TOKEN:
        return jsonify({"error": "Accès non autorisé"}), 403
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "Données invalides, 'name' requis"}), 400
    name = data["name"]
    num_images = data.get("num_images", 3)
    delay = data.get("delay", 1)
    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    if not os.path.exists(person_dir):
        os.makedirs(person_dir)
    saved_files = []

    with camera_lock:
        capturing_in_progress = True
        if not cap.isOpened():
            cap = cv2.VideoCapture(0)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
        for i in range(5):
            ret, frame = cap.read()
            if not ret:
                print(f"Frame {i} non capturée")
            time.sleep(0.1)
        for i in range(num_images):
            ret, frame = cap.read()
            if not ret:
                print(f"Erreur lors de la capture de l'image {i}")
                continue
            filename = f"face_{uuid.uuid4().hex}.jpg"
            file_path = os.path.join(person_dir, filename)
            cv2.imwrite(file_path, frame)
            print(f"Image capturée et enregistrée sous {file_path}")
            saved_files.append(filename)
            time.sleep(delay)
        capturing_in_progress = False

    load_known_faces()
    return jsonify({"status": "authorized person added", "name": name, "files": saved_files})

# --- Enregistrement visiteur inconnu + post-traitement ---
os.makedirs('captured_videos', exist_ok=True)
def record_unknown_visitor(cap):
    uid = int(time.time())
    raw = f"captured_videos/unknown_{uid}.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(raw, fourcc, 20.0, (320,240))
    start = time.time()
    while time.time()-start < 2:
        ret, frm = cap.read()
        if not ret: continue
        frm = cv2.resize(frm,(320,240))
        if isinstance(record_icon, np.ndarray):
            ico = cv2.resize(record_icon,(32,32),interpolation=cv2.INTER_AREA)
            a = ico[:,:,3]/255.0
            for c in range(3):
                frm[10:10+32,10:10+32,c] = ico[:,:,c]*a + frm[10:10+32,10:10+32,c]*(1-a)
        out.write(frm)
        cv2.imshow("Camera", frm); cv2.waitKey(1)
    out.release()
    return raw

def process_video_file(raw):
    out = raw.replace("unknown_","visitor_fixed_")
    os.system(
        f"ffmpeg -y -f lavfi -i anullsrc -i {raw} -shortest "
        f"-c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart {out}"
    )
    os.remove(raw)

# --- Reconnaissance faciale ---
def recognize_face(frame):
    global recognized_anyone
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    locs = face_recognition.face_locations(rgb, model=MODEL)
    encs = face_recognition.face_encodings(rgb, locs)
    match = None
    for enc, loc in zip(encs, locs):
        if True in face_recognition.compare_faces(known_faces, enc, TOLERANCE):
            idx = face_recognition.compare_faces(known_faces, enc, TOLERANCE).index(True)
            match = known_names[idx]
            recognized_anyone = True
            tl, br = (loc[3],loc[0]), (loc[1],loc[2])
            cv2.rectangle(frame, tl, br, (0,255,0), FRAME_THICKNESS)
            cv2.putText(frame, match, (loc[3],loc[2]+20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), FONT_THICKNESS)
            break
    return match, frame

# --- États & gestion porte/sonnette/code ---
lock_status = "locked"
detection_active = False
last_ring_time = None
unlock_time = None
manual_unlock_time = None
camera_view_active = False
recognized_anyone = False

def unlock_door(manual=False):
    global lock_status, manual_unlock_time, unlock_time
    relais.off()
    lock_status = "unlocked"
    now = time.time()
    if manual:
        manual_unlock_time = now
        send_cmd(CMD_MANUAL_UNLOCK)
    unlock_time = now
    

def button_pressed():
    global detection_active, last_ring_time, recognized_anyone
    detection_active = True
    last_ring_time = time.time()
    recognized_anyone = False
    send_cmd(CMD_RING)

button.when_pressed = button_pressed

def handle_mouse_click(event, x, y, flags, param):
    global camera_view_active, lock_status, unlock_time, manual_unlock_time

    if event != cv2.EVENT_LBUTTONDOWN:
        return

    # Bouton central verrou/déverrouillage
    cx = (BG_WIDTH - icon_size[0]) // 2
    cy = (BG_HEIGHT - icon_size[1]) // 2 - 20
    if cx <= x <= cx + icon_size[0] and cy <= y <= cy + icon_size[1] and not camera_view_active:
        if lock_status == "locked":
            unlock_door(manual=True)
        else:
            relais.on()
            lock_status = "locked"
            send_cmd(CMD_MANUAL_LOCK)
            send_cmd(CMD_WELCOME)
        return

    # Icône caméra (haut droite)
    cam_x, cam_y = BG_WIDTH - enlarged_cam.shape[1] - 10, 10
    if cam_x <= x <= cam_x + enlarged_cam.shape[1] and cam_y <= y <= cam_y + enlarged_cam.shape[0] and not camera_view_active:
        camera_view_active = True
        return

    # Croix pour fermer la vue caméra
    if camera_view_active:
        w, h = close_icon.shape[1], close_icon.shape[0]
        if 10 <= x <= 10 + w and 10 <= y <= 10 + h:
            camera_view_active = False

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
cv2.setMouseCallback("Camera", handle_mouse_click)

if __name__ == "__main__":
    threading.Thread(target=lambda: app.run(host="0.0.0.0", port=5000), daemon=True).start()
    cv2.setWindowProperty("Camera", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
    try:
        while True:
            # DIGICODE direct
            if ser and ser.in_waiting:
                raw = ser.read(ser.in_waiting).decode(errors='ignore')
                for ch in raw:
                    if ch.isdigit():
                        code_buffer += ch
                        send_lcd("*" * len(code_buffer))
                        if len(code_buffer) == len(SECRET_CODE):
                            if code_buffer == SECRET_CODE:
                                send_cmd(CMD_CODE_CORRECT)
                                unlock_door()
                            else:
                                send_cmd(CMD_CODE_INCORRECT)
                            code_buffer = ""
                            send_cmd(CMD_WELCOME)

            now = time.time()
            ret, frame = cap.read()
            if not ret:
                break

            if camera_view_active:
                frm = cv2.resize(frame, (BG_WIDTH, BG_HEIGHT))
                overlay_icon(frm, close_icon, (10,10))
                cv2.imshow("Camera", frm)

            elif detection_active:
                send_cmd(CMD_RECON)
                match, ann = recognize_face(frame)
                if match:
                    send_cmd(CMD_UNLOCK)
                    unlock_door()
                    detection_active = False
                elif now - last_ring_time > DETECTION_DURATION:
                    detection_active = False
                    if not recognized_anyone:
                        send_cmd(CMD_NOT_RECOG)
                        send_notification_async("FaciLock", "Visiteur inconnu")
                        send_cmd(CMD_NOTIFY)
                        raw = record_unknown_visitor(cap)
                        threading.Thread(target=process_video_file, args=(raw,), daemon=True).start()
                    send_cmd(CMD_WELCOME)
                disp = cv2.resize(ann, (BG_WIDTH, BG_HEIGHT))
                ico = small_unlocked if lock_status=="unlocked" else small_locked
                overlay_icon(disp, ico, (BG_WIDTH-80, 10))
                cv2.imshow("Camera", disp)

            else:
                show_home_screen()

            # auto-relock
            if unlock_time and now - unlock_time > UNLOCK_DURATION:
                relais.on(); lock_status="locked"; unlock_time = None
                send_cmd(CMD_AUTOLOCK); send_cmd(CMD_WELCOME)
            if manual_unlock_time and now - manual_unlock_time > UNLOCK_DURATION:
                relais.on(); lock_status="locked"; manual_unlock_time = None
                send_cmd(CMD_AUTOLOCK); send_cmd(CMD_WELCOME)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
