import { Client } from 'colyseus.js';
import jwt from 'jsonwebtoken';

const SERVER_URL = 'ws://localhost:3001';

async function main() {
  const client = new Client(SERVER_URL);

  try {
    const token = jwt.sign({ userId: 1 }, 'super-secret-pokemon-key-for-dev');
    // 1. Join world room
    console.log('Joining world...');
    const worldRoom = await client.joinOrCreate('world', { token });
    console.log('Joined world room:', worldRoom.roomId);

    // 2. Wait for BATTLE_START
    worldRoom.onMessage('BATTLE_START', async (data) => {
      console.log('BATTLE_START received:', data.roomId);
      
      // 3. Join battle room
      const battleRoom = await client.joinById(data.roomId, { token });
      console.log('Joined battle room:', battleRoom.roomId);

      battleRoom.onMessage('BATTLE_TURN_RESULT', (res) => {
        console.log('BATTLE_TURN_RESULT:', res);
      });

      // 4. Send RUN action
      console.log('Sending RUN action...');
      battleRoom.send('BATTLE_ACTION', { type: 'RUN' });
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
