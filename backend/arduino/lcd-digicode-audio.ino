#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>

// --- LCD I2C ---
LiquidCrystal_I2C lcd(0x27, 16, 2);

// --- DFPlayer Mini ---
SoftwareSerial dfSerial(10, 11); // RX, TX
DFRobotDFPlayerMini dfPlayer;

// --- Keypad config ---
const byte ROWS = 4, COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[ROWS] = {23,25,27,29};
byte colPins[COLS] = {31,33,35,37};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// --- Buffer pour textes envoyés par le backend ---
String buffer = "";

// --- Fonctions d’affichage LCD ---
void showWelcome(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Sonnez ou");
  lcd.setCursor(0,1); lcd.print("faites le code");
}
void showRecon(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Reconnaissance");
  lcd.setCursor(0,1); lcd.print("en cours");
}
void showUnlock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Ouverture porte");
  delay(1000);
}
void showAutoLock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Fermeture auto");
  delay(1000);
}
void showNotRecognized(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Personne");
  lcd.setCursor(0,1); lcd.print("Non reconnue");
  delay(1000);
}
void showNotify(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Notif envoyee");
  delay(1000);
}
void showManualUnlock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Ouverture manuelle");
  delay(1000);
}
void showManualLock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Fermeture manuelle");
  delay(1000);
}
void showCodeCorrect(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Code correct");
  delay(1000);
}
void showCodeIncorrect(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Code incorrect");
  delay(1000);
}
void showPersonRecognized(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Personne");
  lcd.setCursor(0,1); lcd.print("reconnue");
  delay(1000);
}

void showText(const String &s){
  lcd.clear();
  int nl = s.indexOf('\n');
  if(nl>=0){
    lcd.setCursor(0,0); lcd.print(s.substring(0,nl));
    lcd.setCursor(0,1); lcd.print(s.substring(nl+1));
  } else {
    lcd.setCursor(0,0); lcd.print(s);
  }
}

void setup(){
  Serial.begin(9600);
  lcd.init();
  lcd.backlight();

  // Affichage immédiat du message d'accueil
  showWelcome();

  // Initialisation DFPlayer
  dfSerial.begin(9600);
  if(dfPlayer.begin(dfSerial)){
    dfPlayer.volume(20);
  } else {
    // Si échec, on l'indique quelques secondes à l'écran
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("DFPlayer ERROR");
    delay(2000);
    // Puis on revient à l'accueil
    showWelcome();
  }
}

void loop(){
  // 1) Gérer les commandes série venant du backend
  while(Serial.available()){
    char c = Serial.read();
    switch(c){
      case 'P': showPersonRecognized();                       break; 
      case 'W': showWelcome();                                break;
      case 'B': dfPlayer.play(5);                             break; // 0005.mp3 = sonnette
      case 'R': showRecon();                                  break;
      case 'U': dfPlayer.play(4); showUnlock();               break; // 0004.mp3 = accès autorisé
      case 'A': showAutoLock();                               break;
      case 'N': dfPlayer.play(3); showNotRecognized();        break; // 0003.mp3 = personne non reconnue
      case 'X': showNotify();                                 break;
      case 'L': showManualUnlock();                           break; // même son que ouverture
      case 'M': showManualLock();                             break;
      case 'C': dfPlayer.play(1); showCodeCorrect();          break; // 0001.mp3 = code correct
      case 'I': dfPlayer.play(6); showCodeIncorrect();        break; // 0006.mp3 = code incorrect
      case '\n':
        if(buffer.length()){
          showText(buffer);
          buffer = "";
        }
        break;
      default:
        buffer += c;
        break;
    }
  }

  // 2) Lire le digicode local et renvoyer la touche au backend
  char key = keypad.getKey();
  if(key){
    dfPlayer.play(2);      // 0002.wav = bruit de touche
    Serial.print(key);
  }
}