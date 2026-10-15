#include <Keypad.h>

const byte ROWS = 4; // 4 lignes
const byte COLS = 4; // 4 colonnes

char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte rowPins[ROWS] = {23, 25, 27, 29};    // Connectés aux broches des lignes du Keypad
byte colPins[COLS] = {31, 33, 35, 37};    // Connectés aux broches des colonnes du Keypad

Keypad keypad = Keypad( makeKeymap(keys), rowPins, colPins, ROWS, COLS );

void setup() {
  Serial.begin(9600);
  // Vous pouvez initialiser d'autres éléments si besoin (LED de feedback, buzzer, etc.)
}

void loop() {
  char key = keypad.getKey();
  if (key) {
    // Lorsqu'une touche est pressée, l'envoyer sur le port série.
    Serial.print(key);
  }
  // Vous pouvez mettre une temporisation ou vérifier une combinaison spécifique
}
