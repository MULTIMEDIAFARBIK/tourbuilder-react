import { useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
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

export interface PanoramaProps extends Partial<Omit<PanoPosition, 'basepath'>> {
  basepath: string;
  children?: React.ReactNode;
  singleImage?: boolean;
  onPositionChange?: (position: PanoPosition) => void;
}

// --- The Public Sandbox Component ---
export default function Panorama({children,...props}: PanoramaProps) {
  const propsRef = useRef(props);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  propsRef.current = props;

  const debouncedOnPositionChange = useMemo(() => {
    const { onPositionChange } = propsRef.current;
    if (!onPositionChange) return () => {};
    return debounce(onPositionChange, 150);
  }, [props.onPositionChange]);

  const iframeUrl = useMemo(() => {
    // Import the plain JavaScript player file as raw text

    // CRITICAL: Import the COMPILED IIFE JavaScript bundle, NOT the source TypeScript file.
    console.log(children?.toString());
    const tourbuilderWrapperCode = __WRAPPER_CODE__;

    const serializedProps = JSON.stringify(propsRef.current);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Panorama</title>
          <style>html, body, #tour-container { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }</style>
        </head>
        <body>
          <div id="tour-container"></div>
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

    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [props.basepath]); // Recreate the iframe only when basepath changes

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Pass the debounced callback to the iframe
    (iframe.contentWindow as any).reportPosition = debouncedOnPositionChange;

    const handleMessage = (event: MessageEvent) => {
      // This is a fallback if direct function passing fails
    };
    window.addEventListener('message', handleMessage);
    
    return () => {
      URL.revokeObjectURL(iframeUrl);
      window.removeEventListener('message', handleMessage);
    };
  }, [iframeUrl, debouncedOnPositionChange]);

  const updatePosition = (key: keyof PanoPosition, value:number) => {
      const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
      let tourbuilder = (iframe.contentWindow as any).tour;
      if (!tourbuilder || !tourbuilder.pano) return;
      switch(key) {
        case 'node':
          tourbuilder.pano.openNext(`{node${value}}`);
          break;
        case 'fov':
          tourbuilder.pano.setFov(value);
          break;
        case 'pan':
          tourbuilder.pano.setPan(value);
          break;
        case 'tilt':
          tourbuilder.pano.setTilt(value);
          break;
      }
  }

  useEffect(()=>{
       if(!props.node) return;
        updatePosition('node', props.node);
  },[props.node])
  useEffect(()=>{
       if(!props.fov) return;
        updatePosition('fov', props.fov);
  },[props.fov])
  useEffect(()=>{
       if(!props.pan) return;
        updatePosition('pan', props.pan);
  },[props.pan])
  useEffect(()=>{
       if(!props.tilt) return;
        updatePosition('tilt', props.tilt);
  },[props.tilt])
 useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
  (iframe.contentWindow as any).tour?.setActiveSingleImage(!!props.singleImage);
  },[props.singleImage])

  return (
    <iframe
      ref={iframeRef}
      key={props.basepath}
      title="Panorama Viewer"
      style={{ border: 'none', width: '100%', height: '100%' }}
      src={iframeUrl}
    />
  );
}