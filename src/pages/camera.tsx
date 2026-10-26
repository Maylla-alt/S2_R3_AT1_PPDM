import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraType, CameraMode } from "expo-camera";
import MaterialIcons from '@react-native-vector-icons/material-icons';
import * as MediaLibrary from "expo-media-library"
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../types/RootStackParamList";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

//Define os modos de flash
type FlashMode = "off" | "on" | "auto"

export default function Camera() {
    const navigation = useNavigation<NavigationProp>();

//Permissões do dispositivo
// A expo fornece hooks que retornar statusAtual e função para solicitar

// Permissão de acesso à Câmera
const [cameraPermission, requestCameraPermission] = useCameraPermissions();

// PeSrmissão de acesso ao microfone
const [micPermission, requestMicPermission] = useMicrophonePermissions();

// Permissão para acessar e salvar arquivos na galeria
const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true });

// facing -> controla se estamos usando a câmera traseira ou frontal
const [facing, setFacing] = useState<CameraType>("back");

// cameraMode -> alterna o modo entre foto ou gravar vídeo
const [cameraMode, setCameraMode] = useState<CameraMode>("picture");

// isRecording -> flag para saber se a gravação de vídeo está ativa no momento
const [isRecording, setIsRecording] = useState(false);

// isSaving -> evita que o usuário clique repetidas vezes no botão enquanto a mídia é salva
const [isSaving, setIsSaving] = useState(false);

// flashMode -> armazena o status do flash
const [flashMode, setFlashMode] = useState<FlashMode>("off");

// REFERENCIA DA Câmera
// useRef -> cria a ligação direta com o componente CameraView e nos permite através do .current
// chamar os métodos nativos takePictureAsync(), recordAsync() e stopRecording()
const cameraRef = useRef<CameraView>(null);

// SOLICITAÇÃO INICIAL DAS PERMISSÕES
useEffect(() => {
  (async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  })();
}, []);

// Inverter entre câmera front e traseira
const toggleCameraFacing = () => {
  setFacing((current) => (current === "back" ? "front" : "back"))
}

// Alterna ciclicamente o modo do flash: Desligado -> Ligado -> Automático -> Desligado
const toggleFlashMode = () => {
  setFlashMode((current) => {
    if (current === "off") return "on";
    if (current === "on") return "auto";
    return "off";
  });
};

// Retorna o nome do ícone
const getFlashIcon = () => {
  if (flashMode === "on") return "flash-on";
  if (flashMode === "auto") return "flash-auto";
  return "flash-off";
};

//Muda o modo câmera (Foto ou Vídeo)
const handleCameraMode = (mode: CameraMode) => {
  setCameraMode(mode);

  if (isRecording) {
    setIsRecording(false);
    cameraRef.current?.stopRecording();
  }
};

const takeMedia = async () => {
  // Se a referência da câmera não estiver pronta ou se já estiver salvando algo, ignore o toque
  if (!cameraRef.current || isSaving) return;

  try {
    if (cameraMode === "picture") {
      setIsSaving(true);

      // Tira a foto usando a câmera nativa e retorna o caminho temporário 'uri';
      const foto = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (foto?.uri) {
        let hasPermission = mediaPermission?.granted;

        if (!hasPermission) {
          const permissionResult = await requestMediaPermission();
          hasPermission = permissionResult.granted;
        }
        if (!hasPermission) {
          Alert.alert("Aviso", "Permissão negada para salvar a foto na galeria.");

          setIsSaving(false);
          return;
        }

        await MediaLibrary.createAssetAsync(foto.uri);
        Alert.alert("Sucesso", "Foto salva na galeria");

      }

      setIsSaving(false)
    } else {
      // Se já estiver gravando, o novo clique do usuário serve para PARAR a gravação
if (isRecording) {
  cameraRef.current?.stopRecording();
  return;
}

// Se não estiver gravando, INICIA a gravação
setIsRecording(true);

const video = await cameraRef.current?.recordAsync();
setIsRecording(false);

if (video?.uri) {
        await MediaLibrary.saveToLibraryAsync(video.uri);
        Alert.alert("Sucesso", "Vídeo salvo na galeria!");
      }
    }
  } catch (error) {
    setIsSaving(false);
      setIsRecording(false);
      Alert.alert("Erro", "Não foi possível capturar ou salvar a mídia.");
  }
}

// RENDERIZAÇÃO CONDICIONAL
  // Caso as permissões ainda estejam sendo carregadas
  if (!cameraPermission) {
    return <View style={styles.container} />;
  }

  // Caso o usuário tenha NEGADO acesso à câmera
  if (!cameraPermission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>
          Precisamos de permissão para acessar a câmera
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <CameraView
      style={StyleSheet.absoluteFill}
      ref={cameraRef}
      facing={facing}
      flash={flashMode}
      mode={cameraMode}
      />

      <View style={styles.overlayContainer}>
  <View style={styles.topContainer}>
    <TouchableOpacity style={styles.iconButton} onPress={toggleFlashMode}>
      <MaterialIcons name={getFlashIcon()} size={30} color={flashMode !== "off" ? "#FFD700" : "white"} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
      <MaterialIcons name="cameraswitch" size={30} color="white" />
    </TouchableOpacity>
  </View>

    {/* BARRA INFERIOR - SELETOR DE MODO (FOTO/VÍDEO) E BOTÃO DE DISPARO */}
<View style={styles.bottomContainer}>
  <View style={styles.controlsContainer}>
    <View style={styles.modeSelector}>
      <TouchableOpacity onPress={() => handleCameraMode("picture")}>
  <Text style={[styles.modeText, cameraMode === "picture" && styles.modeTextSelected]}>Foto</Text>
</TouchableOpacity>

    <TouchableOpacity onPress={() => handleCameraMode("video")}>
  <Text style={[styles.modeText, cameraMode === "video" && styles.modeTextSelected]}>Vídeo</Text>
</TouchableOpacity>

    <TouchableOpacity
              style={[
                styles.captureButton,
                isRecording && styles.captureButtonRecording,
              ]}
              onPress={takeMedia}
            >
              <View
                style={[
                  styles.captureInner,
                  isRecording && styles.captureInnerRecording,
                ]}
              />
            </TouchableOpacity>
    </View>
  </View>
</View>

    <View style={styles.buttomVoltarContainer}>
        <TouchableOpacity style={styles.buttomVoltar}onPress={() => navigation.navigate("Home")}>
      <Text>
        Home
      </Text>
    </TouchableOpacity>
      </View>

</View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  topContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 45,
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 10,
    borderRadius: 25,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: 40,
  },
  controlsContainer: {
    alignItems: "center",
  },
  modeSelector: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modeText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  modeTextSelected: {
    color: "white",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonRecording: {
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "white",
  },
  captureInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "red",
  },
  permissionText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // ==========================================
  // CONTAINER E BOTÃO DE VOLTAR (HOME)
  // ==========================================
  buttomVoltarContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  buttomVoltar: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    // Sombra suave para destacar o botão secundário
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  buttomVoltarText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "600",
  },
});
