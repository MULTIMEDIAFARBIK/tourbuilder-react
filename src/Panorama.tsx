import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { createPortal } from "react-dom";
declare const __PLAYER_CODE__: string;
declare const __WRAPPER_CODE__: string;
// --- Type Definitions ---
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

export default function Panorama({ children, ...props }: PanoramaProps) {
  const propsRef = useRef(props);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  propsRef.current = props;

  const debouncedOnPositionChange = useMemo(() => {
    const { onPositionChange } = propsRef.current;
    if (!onPositionChange) return () => {};
    return debounce(onPositionChange, 150);
  }, [props.onPositionChange]);

  const iframeUrl = useMemo(() => {
    console.log(children?.toString());
    const tourbuilderWrapperCode = __WRAPPER_CODE__;

    const serializedProps = JSON.stringify(propsRef.current);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Panorama</title>
          <style>html, body, #tour-container { position: relative; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; } #children-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }</style>
        </head>
        <body>
          <div id="tour-container">
            <div id="children-container"></div>
          </div>
          <script>${tourbuilderWrapperCode}</script>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              try {
                const props = ${serializedProps};
                const Pano360tyClass = window.Pano360ty.default || window.Pano360ty.Pano360ty || window.Pano360ty;
                const tour = new Pano360tyClass('tour-container', props.basepath);
                window.tour = tour;
                
                if (props.node != null) tour.setStartNode(props.node);
                if (props.fov != null) tour.setFov(props.fov);
                if (props.pan != null) tour.setPan(props.pan);
                if (props.tilt != null) tour.setTilt(props.tilt);
                tour.setSingleImage(!!props.singleImage);

                tour.setImpressumVisibility(false);
                tour.setImpressumVisibility_tablet(false);
                tour.setImpressumVisibility_mobile(false);

                tour.setShareButtonVisibility(false);
                tour.setShareButtonVisibility_tablet(false);
                tour.setShareButtonVisibility_mobile(false);

                tour.setHeight("100%");
                tour.setHeight_mobile("100%");
                tour.setHeight_tablet("100%");
                tour.setImpressumVisibility(false);
                tour.setImpressumVisibility_mobile(false);
                tour.setImpressumVisibility_tablet(false);
                tour.movement_params.movementAborted = true;

                if (window.reportPosition) {
                  const positionListener = () => {
                    if (!tour.pano) return;
                    const pos = {
                      basepath: tour.pano.getBasePath(),
                      node: parseInt(tour.pano.getCurrentNode().replace('node', '')),
                      fov: tour.pano.getFov(),
                      pan: tour.pano.getPan(),
                      tilt: tour.pano.getTilt(),
                    };
                    window.reportPosition(pos);
                  };

                  tour.init().then(() => {
                    if (tour.pano) {
                      tour.pano.stopAutorotate();
                      if(props.transition) tour.pano.setTransition(props.transition);
                      tour.pano.addListener("positionchanged", positionListener);
                      tour.pano.addListener("changenode", positionListener);
                    }
                  });
                } else {
                  tour.init();
                }
              } catch (e) {
                console.error('Error initializing tour inside iframe:', e);
              }
            });
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [props.basepath]); // Recreate the iframe only when basepath changes

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      if (iframe.contentWindow) {
        // Find the placeholder div inside the iframe to mount the children
        const doc = iframe.contentWindow.document;
        setMountNode(doc.getElementById('children-container'));
        // Pass the debounced callback to the iframe
        (iframe.contentWindow as any).reportPosition = debouncedOnPositionChange;
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
      URL.revokeObjectURL(iframeUrl);
    };
  }, [iframeUrl, debouncedOnPositionChange]);

  const updatePosition = (key: keyof PanoPosition, value: number) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    let tourbuilder = (iframe.contentWindow as any).tour;
    if (!tourbuilder || !tourbuilder.pano) return;
    switch (key) {
      case "node":
        tourbuilder.pano.openNext(`{node${value}}`);
        break;
      case "fov":
        tourbuilder.pano.setFov(value);
        break;
      case "pan":
        tourbuilder.pano.setPan(value);
        break;
      case "tilt":
        tourbuilder.pano.setTilt(value);
        break;
    }
  };

  useEffect(() => {
    if (!props.node) return;
    updatePosition("node", props.node);
  }, [props.node]);
  useEffect(() => {
    if (!props.fov) return;
    updatePosition("fov", props.fov);
  }, [props.fov]);
  useEffect(() => {
    if (!props.pan) return;
    updatePosition("pan", props.pan);
  }, [props.pan]);
  useEffect(() => {
    if (!props.tilt) return;
    updatePosition("tilt", props.tilt);
  }, [props.tilt]);
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.setActiveSingleImage(
      !!props.singleImage
    );
  }, [props.singleImage]);
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.pano?.setTransition(props.transition);
  }, [props.transition]);

  return (
    <iframe
      ref={iframeRef}
      key={props.basepath}
      title="Panorama Viewer"
      style={{ border: "none", width: "100%", height: "100%" }}
      src={iframeUrl}
    >
      {mountNode && children && createPortal(children, mountNode)}
    </iframe>
  );
}
