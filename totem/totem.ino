#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// --- CONFIGURAÇÕES DE SERVIDOR E API ---
String serverHost = "";
int serverPort = 3001;
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
bool btConfigMode = false;      // Indica que estamos em modo de configuração via BLE

String targetSSID = "";
String targetPass = "";
String totemID = "";
int coletaIntervalo = 2;
unsigned long lastCaptureTime = 0;

// Limites para intervalo de coleta (minutos)
const int COLETA_INTERVALO_MIN = 1;
const int COLETA_INTERVALO_MAX = 1440;

const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
const unsigned long AUTO_RETRY_MS = 15000;

enum BootState { NO_CONFIG,
                 TRY_CONNECTING,
                 CONNECTED };
BootState bootState = NO_CONFIG;

unsigned long lastAutoTry = 0;
bool cameraInitialized = false;

const uint32_t MIN_HEAP_CAPTURE = 45000;
const uint32_t MIN_HEAP_UPLOAD = 38000;
const uint32_t MIN_PSRAM_CAPTURE = 70000;
const size_t UPLOAD_CHUNK_SIZE = 2048;
const char *MULTIPART_BOUNDARY = "--------------------------Ef1eF1eF1";
const float TEMP_MIN = 16.0f;
const float TEMP_MAX = 36.0f;
const float HUM_MIN = 32.0f;
const float HUM_MAX = 88.0f;
const float PRECIP_MIN = 0.0f;
const float PRECIP_MAX = 50.0f;

float simulatedTemperature = 24.0f;
float simulatedHumidity = 58.0f;
float simulatedPrecipitation = 0.0f;
bool simulatedTelemetryInitialized = false;
bool simulatedPrecipInitialized = false;

float clampValue(float value, float minValue, float maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}

float randomFloat(float minValue, float maxValue) {
  const float normalized = (float)esp_random() / 4294967295.0f;
  return minValue + normalized * (maxValue - minValue);
}

void buildSimulatedTelemetry(char *temperatureBuffer, size_t temperatureBufferLen, char *humidityBuffer, size_t humidityBufferLen) {
  if (!simulatedTelemetryInitialized) {
    simulatedTemperature = randomFloat(22.0f, 30.0f);
    simulatedHumidity = randomFloat(45.0f, 72.0f);
    simulatedTelemetryInitialized = true;
  }

  const float tempTarget = randomFloat(20.0f, 34.0f);
  const float tempDrift = randomFloat(-1.4f, 1.4f);
  simulatedTemperature += ((tempTarget - simulatedTemperature) * 0.45f) + tempDrift;
  simulatedTemperature = clampValue(simulatedTemperature, TEMP_MIN, TEMP_MAX);

  const float humidityTarget = 62.0f - ((simulatedTemperature - 24.0f) * 1.1f) + randomFloat(-6.0f, 6.0f);
  const float humidityDrift = randomFloat(-4.0f, 4.0f);
  simulatedHumidity += ((humidityTarget - simulatedHumidity) * 0.55f) + humidityDrift;
  simulatedHumidity = clampValue(simulatedHumidity, HUM_MIN, HUM_MAX);

  snprintf(temperatureBuffer, temperatureBufferLen, "%.2f", simulatedTemperature);
  snprintf(humidityBuffer, humidityBufferLen, "%.2f", simulatedHumidity);
}

void buildSimulatedPrecipitation(char *precipBuffer, size_t precipBufferLen) {
  if (!simulatedPrecipInitialized) {
    simulatedPrecipitation = randomFloat(0.0f, 45.0f);
    simulatedPrecipInitialized = true;
  }

  const float rainChance = randomFloat(0.0f, 1.0f);
  if (rainChance < 0.3f) {
    const float precipPulse = randomFloat(0.0f, 20.0f);
    simulatedPrecipitation += precipPulse;
  } else {
    simulatedPrecipitation *= 0.92f;
  }

  simulatedPrecipitation = clampValue(simulatedPrecipitation, PRECIP_MIN, PRECIP_MAX);

  snprintf(precipBuffer, precipBufferLen, "%.2f", simulatedPrecipitation);
}

String normalizeServerHost(String host) {
  host.trim();

  if (host.startsWith("http://")) {
    host = host.substring(7);
  } else if (host.startsWith("https://")) {
    host = host.substring(8);
  }

  int slashIndex = host.indexOf('/');
  if (slashIndex >= 0) {
    host = host.substring(0, slashIndex);
  }

  int colonIndex = host.lastIndexOf(':');
  if (colonIndex > 0 && host.indexOf(':') == colonIndex) {
    host = host.substring(0, colonIndex);
  }

  host.trim();
  return host;
}

void logMemorySnapshot(const char *stage) {
  Serial.printf("[MEM] %s | freeHeap=%u | minHeap=%u | maxAlloc=%u", stage, ESP.getFreeHeap(), ESP.getMinFreeHeap(), ESP.getMaxAllocHeap());
  if (psramFound()) {
    Serial.printf(" | freePSRAM=%u", ESP.getFreePsram());
  }
  Serial.println();
}

bool hasMemoryForCapture() {
  if (ESP.getFreeHeap() < MIN_HEAP_CAPTURE) return false;
  if (psramFound() && ESP.getFreePsram() < MIN_PSRAM_CAPTURE) return false;
  return true;
}

bool hasMemoryForUpload() {
  if (ESP.getFreeHeap() < MIN_HEAP_UPLOAD) return false;
  if (ESP.getMaxAllocHeap() < UPLOAD_CHUNK_SIZE + 1024) return false;
  return true;
}

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
    btConfigMode = true;
    shouldScanWifi = true;
    Serial.println("BLE Device Connected (BT config mode)");
  };
  void onDisconnect(BLEServer *pServer) override {
    deviceConnected = false;
    btConfigMode = false;
    BLEDevice::startAdvertising();
    Serial.println("BLE Device Disconnected (exit BT config mode)");
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
        if (idRec.length() == 0 || ipRec.length() == 0) {
          Serial.println("Configuracao recusada: campos obrigatorios ausentes (totem_id/ip).");
          return;
        }

        if (intervalRec < COLETA_INTERVALO_MIN || intervalRec > COLETA_INTERVALO_MAX) {
          Serial.println("Intervalo invalido no payload. Usando valor padrao atual.");
          intervalRec = coletaIntervalo;
        }

        targetSSID = ssidRec;
        targetPass = passRec;
        totemID = idRec;
        serverHost = normalizeServerHost(ipRec);
        if (portRec > 0) serverPort = portRec;
        if (intervalRec >= COLETA_INTERVALO_MIN && intervalRec <= COLETA_INTERVALO_MAX) {
          coletaIntervalo = intervalRec;
          // Persistir imediatamente o intervalo para evitar perda em reinício
          preferences.begin("totem-config", false);
          preferences.putInt("interval", coletaIntervalo);
          preferences.end();
          Serial.printf("Intervalo persistido via BLE: %d minutos\n", coletaIntervalo);
        }

        Serial.println("Configuracao recebida. Testando conexao WiFi...");
        requestConnectionTest = true;
      }
    } else {
      Serial.println("Falha ao ler configuracao BLE (JSON invalido).");
    }
  }
};

void setupBLE() {
  BLEDevice::init("MediS-Totem");
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
  Serial.println("\n--- Iniciando envio de imagem ---");
  logMemorySnapshot("pre-capture");

  if (!hasMemoryForCapture()) {
    Serial.println("Memoria insuficiente para captura. Coleta adiada.");
    return "Low Memory Capture";
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Falha no envio: WiFi desconectado.");
    return "Wifi Disconnected";
  }
  if (!cameraInitialized) {
    Serial.println("Falha no envio: camera nao inicializada.");
    return "Camera Not Init";
  }
  if (totemID.length() == 0 || serverHost.length() == 0) {
    Serial.println("Falha no envio: configuracao incompleta (totem_id/host).");
    return "Invalid Config";
  }

  Serial.printf("Destino do upload: host=%s port=%d\n", serverHost.c_str(), serverPort);

  // Tira a foto (descarta frames em cache para evitar duplicação)
  // Issue conhecido: ESP32-CAM pode retornar frame anterior se buffer não for limpo
  for (int attempt = 0; attempt < 5; attempt++) {
    camera_fb_t *fb_discard = esp_camera_fb_get();
    if (fb_discard) {
      Serial.println("Descartando frame cache...");
      esp_camera_fb_return(fb_discard);
      delay(100);
    }
  }

  // Captura frame "real" após descartes
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Falha na captura da imagem.");
    logMemorySnapshot("capture-failed");
    return "Capture Failed";
  }
  Serial.printf("Foto capturada com sucesso (%d bytes).\n", fb->len);
  logMemorySnapshot("post-capture");

  if (!hasMemoryForUpload()) {
    Serial.println("Memoria insuficiente para upload. Tentara novamente no proximo ciclo.");
    esp_camera_fb_return(fb);
    return "Low Memory Upload";
  }

  WiFiClient client;
  // Timeout maior para redes lentas sem reter buffers gigantes em RAM
  client.setTimeout(60000);

  Serial.println("Conectando ao servidor para upload...");
  if (!client.connect(serverHost.c_str(), serverPort)) {
    Serial.println("Falha de conexao com servidor.");
    esp_camera_fb_return(fb);
    return "Connection Failed";
  }
  Serial.println("Conexao estabelecida. Enviando cabecalhos...");

  const size_t boundaryLen = strlen(MULTIPART_BOUNDARY);
  const char *headerTotem = "Content-Disposition: form-data; name=\"totem_id\"\r\n\r\n";
  const char *headerTemp = "Content-Disposition: form-data; name=\"temperatura\"\r\n\r\n";
  const char *headerUmidade = "Content-Disposition: form-data; name=\"umidade\"\r\n\r\n";
  const char *headerPrecip = "Content-Disposition: form-data; name=\"precipitacao\"\r\n\r\n";
  const char *headerFile = "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  char temperatureValue[12] = { 0 };
  char humidityValue[12] = { 0 };
  char precipValue[12] = { 0 };
  buildSimulatedTelemetry(temperatureValue, sizeof(temperatureValue), humidityValue, sizeof(humidityValue));
  buildSimulatedPrecipitation(precipValue, sizeof(precipValue));
  Serial.printf("Leituras simuladas: temperatura=%s C | umidade=%s %% | precipitacao=%s mm\n", temperatureValue, humidityValue, precipValue);

  const size_t boundaryChunkLen = 2 + boundaryLen + 2;  // -- + boundary + \r\n
  const size_t multipartTailLen = boundaryLen + 8;       // \r\n-- + boundary + --\r\n

  size_t totalLen = 0;
  totalLen += boundaryChunkLen + strlen(headerTotem) + totemID.length() + 2;
  totalLen += boundaryChunkLen + strlen(headerTemp) + strlen(temperatureValue) + 2;
  totalLen += boundaryChunkLen + strlen(headerUmidade) + strlen(humidityValue) + 2;
  totalLen += boundaryChunkLen + strlen(headerPrecip) + strlen(precipValue) + 2;
  totalLen += boundaryChunkLen + strlen(headerFile) + fb->len;
  totalLen += multipartTailLen;

  // Envio HTTP Headers
  client.print("POST ");
  client.print(serverPath);
  client.print(" HTTP/1.1\r\n");
  client.print("Host: ");
  client.print(serverHost);
  client.print(":");
  client.print(serverPort);
  client.print("\r\n");
  client.print("Authorization: Bearer ");
  client.print(apiToken);
  client.print("\r\n");
  client.print("Content-Length: ");
  client.print(totalLen);
  client.print("\r\n");
  client.print("Content-Type: multipart/form-data; boundary=");
  client.print(MULTIPART_BOUNDARY);
  client.print("\r\n");
  client.print("Connection: close\r\n\r\n");

  // Envio Corpo (Metadados + Header Arquivo) sem buffers String grandes
  client.print("--");
  client.print(MULTIPART_BOUNDARY);
  client.print("\r\n");
  client.print(headerTotem);
  client.print(totemID);
  client.print("\r\n");

  client.print("--");
  client.print(MULTIPART_BOUNDARY);
  client.print("\r\n");
  client.print(headerTemp);
  client.print(temperatureValue);
  client.print("\r\n");

  client.print("--");
  client.print(MULTIPART_BOUNDARY);
  client.print("\r\n");
  client.print(headerUmidade);
  client.print(humidityValue);
  client.print("\r\n");

  client.print("--");
  client.print(MULTIPART_BOUNDARY);
  client.print("\r\n");
  client.print(headerPrecip);
  client.print(precipValue);
  client.print("\r\n");

  client.print("--");
  client.print(MULTIPART_BOUNDARY);
  client.print("\r\n");
  client.print(headerFile);

  // Envio em chunks fixos para evitar alocacao dinamica recorrente
  Serial.println("Enviando dados da imagem...");
  uint8_t *fbBuf = fb->buf;
  size_t fbLen = fb->len;
  while (fbLen > 0) {
    size_t toSend = (fbLen > UPLOAD_CHUNK_SIZE) ? UPLOAD_CHUNK_SIZE : fbLen;
    size_t written = client.write(fbBuf, toSend);
    if (written != toSend) {
      Serial.println("Falha durante upload: escrita parcial no socket.");
      esp_camera_fb_return(fb);
      client.stop();
      return "Write Error";
    }
    fbBuf += toSend;
    fbLen -= toSend;
  }

  client.print("\r\n--");
  client.print(MULTIPART_BOUNDARY);
  client.print("--\r\n");
  esp_camera_fb_return(fb);
  Serial.println("Upload concluido. Aguardando resposta HTTP...");
  logMemorySnapshot("post-upload");

  // Aguarda primeira linha da resposta para validar status sem String dinamica
  long timeout = millis() + 20000;
  int statusCode = -1;
  char statusLine[48] = { 0 };
  size_t statusIdx = 0;
  bool gotLine = false;

  while (millis() < timeout) {
    if (client.available()) {
      char c = (char)client.read();
      if (c == '\r') {
        continue;
      }
      if (c == '\n') {
        statusLine[statusIdx] = '\0';
        gotLine = true;
        break;
      }
      if (statusIdx < sizeof(statusLine) - 1) {
        statusLine[statusIdx++] = c;
      }
    } else if (!client.connected()) {
      break;
    }
    delay(10);
  }

  if (gotLine) {
    int major = 0;
    int minor = 0;
    int parsed = sscanf(statusLine, "HTTP/%d.%d %d", &major, &minor, &statusCode);
    if (parsed < 3) statusCode = -1;
  }

  long drainTimeout = millis() + 1000;
  while (millis() < drainTimeout && client.connected()) {
    while (client.available()) {
      client.read();
    }
    delay(2);
  }

  client.stop();

  if (statusCode >= 200 && statusCode < 300) {
    Serial.printf("Upload finalizado com sucesso (HTTP %d).\n", statusCode);
    return "Ok";
  } else if (statusCode > 0) {
    Serial.printf("Servidor respondeu com erro HTTP %d.\n", statusCode);
    return "HTTP Error";
  } else {
    Serial.println("Sem resposta valida do servidor (timeout).\n");
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

  char resp[96] = { 0 };
  if (connected) {
    Serial.println("BLE test connect: SUCCESS. IP: " + WiFi.localIP().toString());
    snprintf(resp, sizeof(resp), "{\"status\":\"connected\",\"ip\":\"%s\"}", WiFi.localIP().toString().c_str());

    if (deviceConnected && pCharacteristic) {
      pCharacteristic->setValue((uint8_t *)resp, strlen(resp));
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
    snprintf(resp, sizeof(resp), "{\"status\":\"error\"}");
    if (deviceConnected && pCharacteristic) {
      pCharacteristic->setValue((uint8_t *)resp, strlen(resp));
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
  serverHost = normalizeServerHost(serverHost);
  serverPort = preferences.getInt("srv_port", 3001);
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
      Serial.println("Iniciando varredura de redes WiFi...");
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
      Serial.println("Varredura de WiFi concluida.");
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
      Serial.println("Tentando reconectar no WiFi...");
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
        Serial.println("WiFi conectado. IP: " + WiFi.localIP().toString());
        bootState = CONNECTED;
      } else {
        Serial.println("Falha na conexao WiFi. Nova tentativa em alguns segundos.");
      }
    }
  }

  // --- LÓGICA DA CÂMERA (Apenas se estiver Configurado) ---
  // A variável systemConfigured garante que a câmera não inicie no modo BLE
  if (systemConfigured && WiFi.status() == WL_CONNECTED && !cameraInitialized) {
    Serial.println("WiFi estavel. Aguardando para iniciar camera...");
    delay(500);

    if (initCameraOnce()) {
      cameraInitialized = true;
    } else {
      Serial.println("Falha ao iniciar camera. Nova tentativa no proximo ciclo.");
      delay(2000);
    }
  }

  // Envio de Foto (Apenas se estiver Configurado e Câmera OK)
  if (systemConfigured && WiFi.status() == WL_CONNECTED && totemID.length() > 0 && serverHost.length() > 0 && cameraInitialized && !btConfigMode) {
    unsigned long now = millis();
    unsigned long intervalMs = (unsigned long)coletaIntervalo * 60000;
    if (intervalMs == 0) intervalMs = 60000;
    if (now - lastCaptureTime >= intervalMs) {
      String uploadResult = sendPhoto();
      if (uploadResult == "Ok") {
        lastCaptureTime = now;
      } else {
        unsigned long retryMs = (intervalMs > 15000) ? 15000 : intervalMs;
        if (intervalMs > 3000 && retryMs < 3000) retryMs = 3000;
        Serial.println("Envio sem sucesso. Ajustando proxima tentativa para janela curta.");
        lastCaptureTime = now - (intervalMs - retryMs);
      }
    }
  }

  delay(100);
}