// Shared type definitions for the panorama React wrapper

export type PanoPosition = {
  basepath: string;
  node: number;
  fov: number;
  pan: number;
  tilt: number;
};

export type TransitionSettings = {
  type:
    | "cut"
    | "crossdissolve"
    | "diptocolor"
    | "irisround"
    | "irisrectangular"
    | "wipeleftright"
    | "wiperightleft"
    | "wipetopbottom"
    | "wipebottomtop"
    | "wiperandom";
  before?: 0 | 2; // 0 for none, 2 for zoomin
  after?: 0 | 2 | 3 | 4; // 0 for none, 2 for zoomin, 3 for zoomout, 4 for flyin
  transitiontime?: number;
  waitfortransition?: boolean;
  zoomedfov?: number;
  zoomspeed?: number;
  dipcolor?: string; // e.g., '0xff0000' for red
  softedge?: number;
};
export interface PanoramaProps extends Partial<Omit<PanoPosition, "basepath">> {
  basepath: string;
  children?: React.ReactNode;
  singleImage?: boolean;
  transition?: TransitionSettings;
  onPositionChange?: (position: PanoPosition) => void;
}

// Narrowed snapshot of props used inside the iframe (no functions / React nodes)
export type PanoramaSerializableProps = Omit<
  PanoramaProps,
  "children" | "onPositionChange"
>;
