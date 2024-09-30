export interface Draw {
  x: number;
  y: number;
}

export interface IncomingData {
  type: string;
  payload: Draw;
}