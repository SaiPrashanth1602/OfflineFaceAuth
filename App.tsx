import React, {useEffect} from 'react';
import {View, Text} from 'react-native';

import {calculateEAR, isBlinking} from './src/ai/blinkDetector';
import {detectHeadDirection} from './src/ai/headPose';
import {checkLiveness} from './src/ai/livenessEngine';

export default function App() {
  useEffect(() => {
  console.log("TEST SUCCESS");
}, []);
  useEffect(() => {
    const ear = calculateEAR(40, 2, 2);

    console.log('EAR:', ear);
    console.log('Blink:', isBlinking(ear));

    console.log(
      'Direction:',
      detectHeadDirection(260, 200),
    );

    console.log(
      'Liveness:',
      checkLiveness({
        blinkPassed: true,
        headTurnPassed: true,
      }),
    );
  }, []);

  return (
    <View>
      <Text>Testing Liveness Engine</Text>
    </View>
  );
}