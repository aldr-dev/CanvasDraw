import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import expressWs from 'express-ws';
import {Draw, IncomingData} from './types';

const app = express();
expressWs(app);
app.use(cors());
const port = 8000;

const router = express.Router();

const connectedClients: WebSocket[] = [];
let draw: Draw[] = [];

const isValidDraw = (data: any): data is Draw => {
  return (
    typeof data.x === 'number' &&
    typeof data.y === 'number' &&
    Object.keys(data).length === 2
  );
};

router.ws('/draw', (ws, _) => {
  connectedClients.push(ws);
  ws.send(JSON.stringify({type: 'EXISTING_PIXELS', payload: draw}));

  ws.on('message', (message) => {
    try {
      const decodedMessage = JSON.parse(message.toString()) as IncomingData;
      draw.push(decodedMessage.payload);

      if (decodedMessage.type === 'DRAW_LINE' && isValidDraw(decodedMessage.payload)) {
        connectedClients.forEach((clientWs) => {
          clientWs.send(JSON.stringify({
            type: 'DRAW_LINE',
            payload: decodedMessage.payload,
          }));
        });
      } else {
        ws.send(JSON.stringify({error: 'Invalid draw data'}));
      }
    } catch (error) {
      ws.send(JSON.stringify({error: 'Invalid Data Format'}));
    }
  });

  ws.on('close', () => {
    const index = connectedClients.indexOf(ws);
    if (index !== -1) {
      connectedClients.splice(index, 1);
    }
  });
});

app.use(router);

app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});