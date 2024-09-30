import { useEffect, useRef, useState } from 'react';
import { IncomingData } from './types';
import * as React from 'react';
import './App.css';

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      contextRef.current = canvas.getContext('2d');
      canvas.width = 1200;
      canvas.height = 600;

      ws.current = new WebSocket('ws://localhost:8000/draw');
      ws.current.onclose = () => console.log('WS disconnected!');

      ws.current.onmessage = (event) => {
        const decodedMessage = JSON.parse(event.data) as IncomingData;
        if (decodedMessage.type === 'DRAW_LINE' && decodedMessage.payload) {
          drawPixels(decodedMessage.payload.x, decodedMessage.payload.y);
        } else if (decodedMessage.type === 'EXISTING_PIXELS' && Array.isArray(decodedMessage.payload)) {
          decodedMessage.payload.forEach((point) => {
            drawPixels(point.x, point.y);
          });
        }
      };
    }

    return () => ws.current?.close();
  }, []);

  const drawPixels = (x: number, y: number) => {
    if (contextRef.current) {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
      contextRef.current.moveTo(x, y);
    }
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      const rect = canvas.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);

      sendDrawData(offsetX, offsetY);
    }
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    contextRef.current?.beginPath();
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    const canvas = canvasRef.current;
    if (canvas && contextRef.current) {
      const rect = canvas.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      contextRef.current.strokeStyle = 'black';
      contextRef.current.lineWidth = 1;
      drawPixels(offsetX, offsetY);

      sendDrawData(offsetX, offsetY);
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      finishDrawing();
    }
  };

  const sendDrawData = (x: number, y: number) => {
    if (ws.current) {
      const data = { type: 'DRAW_LINE', payload: { x, y } };
      ws.current.send(JSON.stringify(data));
    }
  };

  return (
    <div>
      <h1 className="canvas-draw-headline">CanvasDraw &#9998;</h1>
      <canvas
        onMouseMove={draw}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseLeave={handleMouseLeave}
        ref={canvasRef}
        className="canvas-draw"
      />
    </div>
  );
};

export default App;