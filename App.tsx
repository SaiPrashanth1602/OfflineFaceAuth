import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import { BlinkDetector } from './src/ai/blinkDetector';
import { detectHeadDirection } from './src/ai/headPose';
import { checkLiveness } from './src/ai/livenessEngine';

export default function App() {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [faceDetected, setFaceDetected] = useState(false);
  const [ear, setEar] = useState(0.3);
  const [headDirection, setHeadDirection] = useState<
    'LEFT' | 'RIGHT' | 'CENTER'
  >('CENTER');
  const [blinkPassed, setBlinkPassed] = useState(false);
  const [headTurnPassed, setHeadTurnPassed] = useState(false);

  const blinkDetector = useMemo(() => new BlinkDetector(), []);

  const handleFaceDetected = () => {
    setFaceDetected(true);
  };

  const handleFaceLost = () => {
    setFaceDetected(false);
    setEar(0.3);
    setHeadDirection('CENTER');
    setBlinkPassed(false);
    setHeadTurnPassed(false);
  };

  const handleBlink = () => {
    const closedEar = 0.1;
    const openEar = 0.3;

    blinkDetector.detect(closedEar);
    const blink = blinkDetector.detect(openEar);

    setEar(openEar);
    setBlinkPassed(blink);
  };

  const handleTurnLeft = () => {
    const direction = detectHeadDirection(50, 100);
    setHeadDirection(direction);
    setHeadTurnPassed(direction === 'LEFT' || direction === 'RIGHT');
  };

  const handleTurnRight = () => {
    const direction = detectHeadDirection(150, 100);
    setHeadDirection(direction);
    setHeadTurnPassed(direction === 'LEFT' || direction === 'RIGHT');
  };

  const handleCenter = () => {
    const direction = detectHeadDirection(100, 100);
    setHeadDirection(direction);
    setHeadTurnPassed(false);
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera Permission Needed</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No Front Camera Found</Text>
      </View>
    );
  }

  const livenessPassed = checkLiveness({
    blinkPassed,
    headTurnPassed,
  });

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />

      <View style={styles.overlay}>
        <Text style={styles.header}>Offline Face Auth</Text>

        <View
          style={[
            styles.faceFrame,
            {
              borderColor: livenessPassed
                ? '#00ff99'
                : faceDetected
                ? '#ffaa00'
                : '#ff4444',
            },
          ]}
        />

        <View style={styles.infoCard}>
          <Text style={styles.statusText}>
            {faceDetected ? 'Face detected' : 'No face detected'}
          </Text>

          <Text style={styles.debugText}>EAR: {ear.toFixed(2)}</Text>
          <Text style={styles.debugText}>
            Blink: {blinkPassed ? 'YES' : 'NO'}
          </Text>
          <Text style={styles.debugText}>Head: {headDirection}</Text>
          <Text style={styles.debugText}>
            Head turn passed: {headTurnPassed ? 'YES' : 'NO'}
          </Text>
          <Text style={styles.debugText}>
            Liveness: {livenessPassed ? 'PASSED' : 'WAITING'}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFaceDetected}
            >
              <Text style={styles.actionButtonText}>Face Detected</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFaceLost}
            >
              <Text style={styles.actionButtonText}>Face Lost</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleBlink}>
              <Text style={styles.actionButtonText}>Blink</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTurnLeft}
            >
              <Text style={styles.actionButtonText}>Turn Left</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTurnRight}
            >
              <Text style={styles.actionButtonText}>Turn Right</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCenter}
            >
              <Text style={styles.actionButtonText}>Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 12,
  },
  faceFrame: {
    width: 220,
    height: 280,
    borderWidth: 3,
    borderRadius: 140,
    backgroundColor: 'transparent',
  },
  infoCard: {
    width: '88%',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#9fe6b3',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 16,
    width: '100%',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
