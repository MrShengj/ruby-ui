export interface NodeData {
  id?: string;
  shape?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  attrs?: any;
  data?: any;
}

export interface EdgeData {
  id?: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
  label?: string;
  attrs?: any;
}

export interface OperateX6Props {
  nodes?: NodeData[];
  edges?: EdgeData[];
  rgbs?: any[];
  elements?: any[];
  skills?: any[];
  onChange?: (nodes: NodeData[], edges: EdgeData[]) => void;
}

export interface ColorSaveData {
  coordinate: string;
  rgb: string;
  hex: string;
}

export interface TimerData {
  name: string;
  time: number;
}
