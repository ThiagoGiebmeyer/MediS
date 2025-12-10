#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <mbedtls/base64.h>

// --- CONFIGURAÇÕES DE SERVIDOR E API ---
String serverHost = "";
int serverPort = 3000;
const char *serverPath = "/api/totem/reading";

// ✅ TOKEN
const char *apiToken = "medis_totem_3952896fda05ebb26696c2ab87c08775624c0623d317cf9948fca362b48c6b1a";

// --- Pinos da Câmera (AI Thinker ESP32-CAM) ---
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLECharacteristic *pCharacteristic = nullptr;
Preferences preferences;

// Flags de Estado
bool deviceConnected = false;
bool shouldScanWifi = false;
bool requestConnectionTest = false;
bool systemConfigured = false;  // Define se opera em modo Câmera ou modo Config (BLE)

String targetSSID = "";
String targetPass = "";
String totemID = "";
int coletaIntervalo = 2;
unsigned long lastCaptureTime = 0;

const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
const unsigned long AUTO_RETRY_MS = 15000;

enum BootState { NO_CONFIG,
                 TRY_CONNECTING,
                 CONNECTED };
BootState bootState = NO_CONFIG;

unsigned long lastAutoTry = 0;
bool cameraInitialized = false;

const char PROGMEM b64_chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

void checkSerialCommand() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command == "RESET") {
      Serial.println("\n--- RESET COMMAND RECEIVED ---");
      preferences.begin("totem-config", false);
      preferences.clear();
      preferences.end();
      delay(1000);
      ESP.restart();
    }
  }
}

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) override {
    deviceConnected = true;
    shouldScanWifi = true;
    Serial.println("BLE Device Connected");
  };
  void onDisconnect(BLEServer *pServer) override {
    deviceConnected = false;
    BLEDevice::startAdvertising();
    Serial.println("BLE Device Disconnected");
  }
};

class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    std::string stdVal(pCharacteristic->getValue().c_str());
    String raw = String(stdVal.c_str());
    raw.trim();

    String cleanRaw = "";
    for (int i = 0; i < raw.length(); i++) {
      char c = raw[i];
      if (c >= 32 && c <= 126) cleanRaw += c;
    }

    if (cleanRaw.length() == 0) return;

    Serial.println("BLE Raw Data: " + cleanRaw);

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, cleanRaw);

    if (!error) {
      String ssidRec = doc["ssid"].as<String>();
      String passRec = doc["password"].as<String>();
      String idRec = doc["totem_id"].as<String>();
      String ipRec = doc["ip"].as<String>();
      int portRec = doc["port"].as<int>();
      int intervalRec = doc["interval"].as<int>();

      ssidRec.trim();
      passRec.trim();
      idRec.trim();
      ipRec.trim();

      if (ssidRec.length() > 0) {
        targetSSID = ssidRec;
        targetPass = passRec;
        totemID = idRec;
        serverHost = ipRec;
        if (portRec > 0) serverPort = portRec;
        if (intervalRec > 0) coletaIntervalo = intervalRec;

        Serial.println("JSON Parsed successfully. Requesting connection test...");
        requestConnectionTest = true;
      }
    } else {
      Serial.println("BLE JSON Parsing Error");
    }
  }
};

void setupBLE() {
  BLEDevice::init("MediS-TC");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY);
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setValue("[]");
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.println("BLE Initialized and Advertising (Config Mode)");
}

bool initCameraOnce() {
  // Configuração da câmera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_UXGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Inicializa a câmera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error: 0x%x\n", err);
    return false;
  }
  Serial.println("Camera Initialized Successfully");
  return true;
}

String sendPhoto() {
  Serial.println("\n--- Starting Multipart Upload ---");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error: WiFi Disconnected");
    return "Wifi Disconnected";
  }
  if (!cameraInitialized) {
    Serial.println("Error: Camera Not Init");
    return "Camera Not Init";
  }

  // Tira a foto
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Error: Capture Failed");
    return "Capture Failed";
  }
  Serial.printf("Picture taken! Size: %d bytes\n", fb->len);

  WiFiClient client;
  // AUMENTADO PARA 60s (Evita queda em redes lentas)
  client.setTimeout(60000);

  Serial.println("Connecting to server...");
  if (!client.connect(serverHost.c_str(), serverPort)) {
    Serial.println("Error: Connection Failed");
    esp_camera_fb_return(fb);
    return "Connection Failed";
  }
  Serial.println("Connected! Sending headers...");

  String boundary = "--------------------------Ef1eF1eF1";

  // Cabeçalho dos metadados
  String bodyHead = "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\"totem_id\"\r\n\r\n" + totemID + "\r\n" + "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\"temperatura\"\r\n\r\n25.50\r\n" + "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\"umidade\"\r\n\r\n60.00\r\n";

  // Cabeçalho do arquivo
  String fileHead = "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n" + "Content-Type: image/jpeg\r\n\r\n";

  // Fechamento
  String bodyTail = "\r\n--" + boundary + "--\r\n";

  size_t totalLen = bodyHead.length() + fileHead.length() + fb->len + bodyTail.length();

  // Envio HTTP Headers
  client.print("POST " + String(serverPath) + " HTTP/1.1\r\n");
  client.print("Host: " + serverHost + ":" + String(serverPort) + "\r\n");
  client.print("Authorization: Bearer " + String(apiToken) + "\r\n");
  client.print("Content-Length: " + String(totalLen) + "\r\n");
  client.print("Content-Type: multipart/form-data; boundary=" + boundary + "\r\n");
  client.print("Connection: close\r\n\r\n");

  // Envio Corpo (Metadados + Header Arquivo)
  client.print(bodyHead);
  client.print(fileHead);

  // --- OTIMIZAÇÃO DE ENVIO DA IMAGEM ---
  Serial.println("Sending image data...");
  uint8_t *fbBuf = fb->buf;
  size_t fbLen = fb->len;

  // Buffer de 4KB (Muito mais rápido que 1KB)
  const size_t bufferSize = 4096;
  uint8_t *buffer = (uint8_t *)malloc(bufferSize);

  if (buffer) {
    // Modo Copia Segura
    while (fbLen > 0) {
      size_t toSend = (fbLen > bufferSize) ? bufferSize : fbLen;
      memcpy(buffer, fbBuf, toSend);  // Copia para buffer local (opcional, mas estável)

      size_t written = client.write(buffer, toSend);

      if (written != toSend) {
        Serial.println("Error: Upload interrupted/failed writing to client");
        free(buffer);
        esp_camera_fb_return(fb);
        client.stop();
        return "Write Error";
      }

      fbBuf += toSend;
      fbLen -= toSend;
      // Delay removido para máxima velocidade
    }
    free(buffer);
  } else {
    // Fallback se faltar memória (envia direto do ponteiro da camera)
    while (fbLen > 0) {
      size_t toSend = (fbLen > 1024) ? 1024 : fbLen;
      client.write(fbBuf, toSend);
      fbBuf += toSend;
      fbLen -= toSend;
    }
  }

  client.print(bodyTail);
  esp_camera_fb_return(fb);
  Serial.println("Data sent. Waiting for response...");

  // Aguarda resposta
  long timeout = millis() + 20000;
  String response = "";
  bool responseStarted = false;

  while (millis() < timeout) {
    if (client.available()) {
      responseStarted = true;
      char c = client.read();
      response += c;
    } else if (responseStarted && !client.connected()) {
      break;
    }
    delay(10);
  }

  client.stop();

  if (response.length() > 0) {
    Serial.println("--- Server Response ---");
    Serial.println(response);
    Serial.println("-----------------------");
    return "Ok";
  } else {
    Serial.println("Error: No response from server (Timeout)");
    return "Timeout";
  }
}

void executeConnectionTest() {
  Serial.println("Starting connection test...");
  WiFi.disconnect(true);
  delay(200);
  WiFi.begin(targetSSID.c_str(), targetPass.c_str());

  unsigned long start = millis();
  bool connected = false;
  while ((millis() - start) < WIFI_CONNECT_TIMEOUT_MS) {
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
      break;
    }
    delay(200);
  }

  String resp;
  if (connected) {
    Serial.println("BLE test connect: SUCCESS. IP: " + WiFi.localIP().toString());
    resp = "{\"status\":\"connected\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";

    if (deviceConnected && pCharacteristic) {
      pCharacteristic->setValue((uint8_t *)resp.c_str(), resp.length());
      pCharacteristic->notify();
      delay(500);
    }

    preferences.begin("totem-config", false);
    preferences.putString("ssid", targetSSID);
    preferences.putString("pass", targetPass);
    preferences.putString("tid", totemID);
    preferences.putString("srv_ip", serverHost);
    preferences.putInt("srv_port", serverPort);
    preferences.putInt("interval", coletaIntervalo);
    preferences.end();

    // Requisito 3: Reiniciar após 5s
    Serial.println("Config saved. Restarting in 5s...");
    delay(5000);
    ESP.restart();
  } else {
    Serial.println("BLE test connect: FAILED.");
    resp = "{\"status\":\"error\"}";
    if (deviceConnected && pCharacteristic) {
      pCharacteristic->setValue((uint8_t *)resp.c_str(), resp.length());
      pCharacteristic->notify();
      delay(100);
    }
    WiFi.disconnect(true);
  }
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  delay(100);

  // Garante câmera desligada no boot
  pinMode(PWDN_GPIO_NUM, OUTPUT);
  digitalWrite(PWDN_GPIO_NUM, HIGH);

  preferences.begin("totem-config", true);
  String savedSSID = preferences.getString("ssid", "");
  String savedPass = preferences.getString("pass", "");
  totemID = preferences.getString("tid", "");
  serverHost = preferences.getString("srv_ip", "");
  serverPort = preferences.getInt("srv_port", 3000);
  coletaIntervalo = preferences.getInt("interval", 2);
  preferences.end();

  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(300);

  // --- LÓGICA DE INICIALIZAÇÃO CONDICIONAL ---
  if (savedSSID.length() > 0) {
    // CASO 2: Configuração Salva -> Inicia WiFi e Câmera. SEM BLE.
    Serial.println("System Configured. Starting WIFI + CAMERA (No BT).");
    systemConfigured = true;

    targetSSID = savedSSID;
    targetPass = savedPass;
    bootState = TRY_CONNECTING;
    lastAutoTry = 0;

    // Nota: O initCameraOnce será chamado no loop() assim que o WiFi conectar
    // para evitar picos de corrente na inicialização.

  } else {
    // CASO 1: Sem Configuração -> Inicia BLE e WiFi (scan). SEM CAMERA.
    Serial.println("No Config Found. Starting BT + WIFI (No Camera).");
    systemConfigured = false;
    bootState = NO_CONFIG;

    setupBLE();
  }
}

void loop() {
  checkSerialCommand();

  // --- Lógica BLE e Scan (Apenas se NÃO estiver configurado) ---
  if (!systemConfigured) {

    if (shouldScanWifi) {
      shouldScanWifi = false;
      WiFi.disconnect();
      delay(100);
      Serial.println("Starting WiFi Scan...");
      int n = WiFi.scanNetworks();
      String json = "[";
      int count = 0;
      for (int i = 0; i < n; ++i) {
        if (count >= 8) break;
        if (count > 0) json += ",";
        String ssid = WiFi.SSID(i);
        ssid.replace("\"", "");
        json += "{\"ssid\":\"" + ssid + "\",\"rssi\":" + String(WiFi.RSSI(i)) + ",\"secure\":" + ((WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "false" : "true") + "}";
        count++;
      }
      json += "]";
      if (pCharacteristic) pCharacteristic->setValue((uint8_t *)json.c_str(), json.length());
      Serial.println("WiFi Scan completed.");
    }

    if (requestConnectionTest) {
      requestConnectionTest = false;
      executeConnectionTest();
    }
  }

  // --- Lógica de Conexão WiFi (Apenas se estiver Configurado) ---
  if (systemConfigured && bootState == TRY_CONNECTING) {
    unsigned long now = millis();
    if (now - lastAutoTry >= AUTO_RETRY_MS) {
      lastAutoTry = now;
      Serial.println("Boot: attempting auto-connect...");
      WiFi.begin(targetSSID.c_str(), targetPass.c_str());

      unsigned long start = millis();
      bool connected = false;
      while ((millis() - start) < WIFI_CONNECT_TIMEOUT_MS) {
        if (WiFi.status() == WL_CONNECTED) {
          connected = true;
          break;
        }
        delay(200);
      }

      if (connected) {
        Serial.println("Boot: WiFi Connected! IP: " + WiFi.localIP().toString());
        bootState = CONNECTED;
      } else {
        Serial.println("Boot: Connect failed. Retry later.");
      }
    }
  }

  // --- LÓGICA DA CÂMERA (Apenas se estiver Configurado) ---
  // A variável systemConfigured garante que a câmera não inicie no modo BLE
  if (systemConfigured && WiFi.status() == WL_CONNECTED && !cameraInitialized) {
    Serial.println("WiFi Stable. Waiting for power stabilization before Camera Init...");
    delay(500);

    if (initCameraOnce()) {
      cameraInitialized = true;
    } else {
      Serial.println("Camera Init Failed. Will retry next loop if Wifi stays on.");
      delay(2000);
    }
  }

  // Envio de Foto (Apenas se estiver Configurado e Câmera OK)
  if (systemConfigured && WiFi.status() == WL_CONNECTED && totemID.length() > 0 && serverHost.length() > 0 && cameraInitialized) {
    unsigned long now = millis();
    unsigned long intervalMs = (unsigned long)coletaIntervalo * 60000;
    if (intervalMs == 0) intervalMs = 60000;
    if (now - lastCaptureTime >= intervalMs) {
      sendPhoto();
      lastCaptureTime = now;
    }
  }

  delay(100);
}