import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

export default function App() {
  const [permission, setPermission] = useState(false);
  const device = useCameraDevice('front');

  useEffect(() => {
    async function requestPermission() {
      const status = await Camera.requestCameraPermission();
      setPermission(status === 'granted');
    }

    requestPermission();
  }, []);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>No Camera Permission</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text>Loading Camera...</Text>
      </View>
    );
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});