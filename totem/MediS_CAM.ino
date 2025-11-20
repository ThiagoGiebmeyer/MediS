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

String serverHost = "";
int serverPort = 3000;
const char *serverPath = "/api/totem/reading/upload";

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

bool deviceConnected = false;
bool shouldScanWifi = false;
bool requestConnectionTest = false;

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
}

bool initCameraOnce() {
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

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error: 0x%x\n", err);
    return false;
  }
  Serial.println("Camera Initialized Successfully");
  return true;
}


String sendPhoto() {
  Serial.println("--- Starting Upload (mbedtls Base64) ---");

  if (WiFi.status() != WL_CONNECTED) return "Wifi Disconnected";

  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) return "Capture Failed";
  Serial.printf("Photo captured: %u bytes\n", fb->len);

  WiFiClient client;
  client.setTimeout(30000);  // Aumenta timeout para 30s
  client.setNoDelay(true);   // Desabilita Nagle (envia imediatamente)

  if (!client.connect(serverHost.c_str(), serverPort)) {
    esp_camera_fb_return(fb);
    return "Connection Failed";
  }
  Serial.println("Connected! Encoding with mbedtls...");

  // 1. Calcula tamanho necessário para Base64
  size_t outputLen = 0;
  mbedtls_base64_encode(NULL, 0, &outputLen, fb->buf, fb->len);

  // 2. Aloca buffer para Base64
  uint8_t *base64Buffer = (uint8_t *)ps_malloc(outputLen);
  if (!base64Buffer) {
    Serial.println("Failed to allocate Base64 buffer");
    esp_camera_fb_return(fb);
    client.stop();
    return "Memory Error";
  }

  // 3. Codifica para Base64 (RÁPIDO!)
  unsigned long startEncode = millis();
  int ret = mbedtls_base64_encode(base64Buffer, outputLen, &outputLen, fb->buf, fb->len);
  Serial.printf("Base64 encoded in %lu ms\n", millis() - startEncode);

  if (ret != 0) {
    Serial.printf("ERROR: mbedtls_base64_encode failed with code: %d\n", ret);
    free(base64Buffer);
    esp_camera_fb_return(fb);
    client.stop();
    return "Encode Error";
  }

  // Verifica se conexão ainda está ativa
  if (!client.connected()) {
    Serial.println("ERROR: Connection lost after encoding");
    free(base64Buffer);
    esp_camera_fb_return(fb);
    return "Connection Lost";
  }

  // 4. Prepara JSON
  String jsonHead = "{\"temperatura\":\"25.50\",\"umidade\":\"60.00\",\"totem_id\":\"" + totemID + "\",\"image\":\"";
  String jsonTail = "\"}";
  size_t totalLen = jsonHead.length() + outputLen + jsonTail.length();

  // 5. Envia HTTP Headers
  client.print("POST " + String(serverPath) + " HTTP/1.1\r\n");
  client.print("Host: " + serverHost + ":" + String(serverPort) + "\r\n");
  client.print("Authorization: Bearer medis_totem_3952896fda05ebb26696c2ab87c08775624c0623d317cf9948fca362b48c6b1a\r\n");
  client.print("Content-Type: application/json\r\n");
  client.print("Content-Length: " + String(totalLen) + "\r\n");
  client.print("Connection: close\r\n\r\n");

  // 6. Envia JSON Head
  size_t written = client.print(jsonHead);
  Serial.printf("JSON head sent: %d bytes\n", written);

  // 7. Envia Base64 em chunks (com feedback)
  size_t sent = 0;
  const size_t chunkSize = 1460;  // MTU TCP otimizado
  unsigned long lastPrint = millis();

  while (sent < outputLen) {
    size_t toSend = min(chunkSize, outputLen - sent);
    size_t actualSent = client.write(base64Buffer + sent, toSend);

    if (actualSent == 0) {
      Serial.println("ERROR: Failed to send data");
      break;
    }

    sent += actualSent;

    // Feedback a cada 20KB
    if (millis() - lastPrint > 1000) {
      Serial.printf("Sent: %d/%d bytes (%.1f%%)\n", sent, outputLen, (sent * 100.0) / outputLen);
      lastPrint = millis();
    }

    // Pequeno delay para não sobrecarregar
    if (sent % (chunkSize * 10) == 0) {
      delay(1);
    }
  }

  Serial.printf("Base64 sent: %d bytes\n", sent);

  // 8. Envia JSON Tail
  written = client.print(jsonTail);
  Serial.printf("JSON tail sent: %d bytes\n", written);
  Serial.println("Stream completed. Waiting response...");

  // 9. Lê resposta
  long timeout = millis() + 10000;
  while (millis() < timeout) {
    while (client.available()) {
      String line = client.readStringUntil('\n');
      if (line.startsWith("HTTP/1.1")) Serial.println("SERVER: " + line);
    }
    if (!client.connected() && !client.available()) break;
    delay(10);
  }

  // 10. Cleanup
  free(base64Buffer);
  esp_camera_fb_return(fb);
  client.stop();
  Serial.println("--- Done ---");
  return "Ok";
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

    Serial.println("Config saved. Restarting in 3s...");
    delay(3000);
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
  Serial.begin(115200);
  delay(100);

  preferences.begin("totem-config", true);
  String savedSSID = preferences.getString("ssid", "");
  String savedPass = preferences.getString("pass", "");
  totemID = preferences.getString("tid", "");
  serverHost = preferences.getString("srv_ip", "");
  serverPort = preferences.getInt("srv_port", 3000);
  coletaIntervalo = preferences.getInt("interval", 2);
  preferences.end();

  Serial.println(totemID.length() > 0 ? "Config Loaded: " + totemID : "No config found.");

  setupBLE();
  Serial.println("BLE Active");

  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(300);

  if (savedSSID.length() > 0) {
    targetSSID = savedSSID;
    targetPass = savedPass;
    bootState = TRY_CONNECTING;
    lastAutoTry = 0;
  } else {
    bootState = NO_CONFIG;
  }
}

void loop() {
  checkSerialCommand();

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

  if (bootState == TRY_CONNECTING) {
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

  if (WiFi.status() == WL_CONNECTED && !cameraInitialized) {
    if (initCameraOnce()) cameraInitialized = true;
  }

  if (WiFi.status() == WL_CONNECTED && totemID.length() > 0 && serverHost.length() > 0 && cameraInitialized) {
    unsigned long now = millis();
    unsigned long intervalMs = (unsigned long)1 * 60000;
    if (intervalMs == 0) intervalMs = 60000;
    if (now - lastCaptureTime >= intervalMs) {
      sendPhoto();
      lastCaptureTime = now;
    }
  }

  delay(100);
}