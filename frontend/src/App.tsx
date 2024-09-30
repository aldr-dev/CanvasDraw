import {useEffect, useRef, useState} from 'react';
import {IncomingData} from './types';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const ws = useRef<WebSocket | null>(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      contextRef.current = ctx;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ws.current = new WebSocket('ws://localhost:8000/draw');
    ws.current.onclose = () => console.log('WS disconnected!');

    ws.current.onmessage = (event) => {
      const decodedMessage = JSON.parse(event.data) as IncomingData;
      if (decodedMessage.type === 'DRAW_LINE' && decodedMessage.payload) {
        drawPixels([decodedMessage.payload]);
      } else if (decodedMessage.type === 'EXISTING_PIXELS' && Array.isArray(decodedMessage.payload)) {
        drawPixels(decodedMessage.payload);
      }
    }

    return () => ws.current?.close();
  }, []);

  const drawPixels = (pixelsToDraw: { x: number; y: number;}[]) => {
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, contextRef.current.canvas.width, contextRef.current.canvas.height);
      pixelsToDraw.forEach((pixel) => {
        if (contextRef.current){
          contextRef.current.fillRect(pixel.x, pixel.y, 1, 1);
        }
      });
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default App;