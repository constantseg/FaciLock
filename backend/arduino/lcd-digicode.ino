#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

// --- LCD I2C ---
LiquidCrystal_I2C lcd(0x27,16,2);
String buffer = "";

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

void setup(){
  Serial.begin(9600);
  lcd.init(); lcd.backlight();
  showWelcome();
}

void loop(){
  // 1) gérer commandes entrantes (backend)
  while(Serial.available()){
    char c = Serial.read();
    switch(c){
      case 'W': showWelcome();       break;
      case 'R': showRecon();         break;
      case 'U': showUnlock();        break;
      case 'A': showAutoLock();      break;
      case 'N': showNotRecognized(); break;
      case 'X': showNotify();        break;
      case 'L': showManualUnlock();  break;
      case 'M': showManualLock();    break;
      case 'C': showCodeCorrect();   break;
      case 'I': showCodeIncorrect();   break;
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

  // 2) lire le digicode et renvoyer la touche au backend
  char key = keypad.getKey();
  if(key){
    Serial.print(key);
  }
}

// --- Affichages LCD ---
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
  delay (1500);
}
void showAutoLock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Fermeture auto");
  delay (1500);
}
void showNotRecognized(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Non reconnue");
  delay (1500);
}
void showNotify(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Notif envoyee");
  delay (1500);
}
void showManualUnlock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Ouverture manuelle");
  delay (1500);
}
void showManualLock(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Fermeture manuelle");
  delay (1500);
}

void showCodeIncorrect(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Code incorrect");
  delay (1500);
}

void showCodeCorrect(){
  lcd.clear();
  lcd.setCursor(0,0); lcd.print("Code correct");
  delay (1500);
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
