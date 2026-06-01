import React, {useEffect} from 'react';
import {View, Text} from 'react-native';

import {calculateEAR, isBlinking} from './src/ai/blinkDetector';
import {detectHeadDirection} from './src/ai/headPose';
import {checkLiveness} from './src/ai/livenessEngine';

import {initDatabase} from './src/ai/database/db';
import {UserRepository} from './src/ai/repositories/UserRepository';

export default function App() {
  useEffect(() => {
    const testDatabase = async () => {
      try {
        console.log('========================');
        console.log('DATABASE TEST START');
        console.log('========================');

        await initDatabase();
        console.log('✅ DATABASE READY');

        await UserRepository.createUser({
          id: '1',
          name: 'Suba',
          embedding: 'test_embedding',
        });

        console.log('✅ USER CREATED');

        const user = await UserRepository.getUser('1');

        console.log('✅ USER RETRIEVED');
        console.log(user);

        console.log('========================');
        console.log('DATABASE TEST COMPLETE');
        console.log('========================');
      } catch (error) {
        console.error('❌ DATABASE TEST FAILED');
        console.error(error);
      }
    };

    testDatabase();
  }, []);

  useEffect(() => {
    console.log('TEST SUCCESS');
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
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>OfflineFaceAuth Debug Mode</Text>
    </View>
  );
}