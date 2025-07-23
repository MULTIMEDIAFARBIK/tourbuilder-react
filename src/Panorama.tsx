import { useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import tourbuilderWrapperCode from '../../tourbuilder/dist/index.iife.js?raw';
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
  singleImage?: boolean;
  onPositionChange?: (position: PanoPosition) => void;
}

// --- The Public Sandbox Component ---
export default function Panorama(props: PanoramaProps) {
  const propsRef = useRef(props);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  propsRef.current = props;

  const debouncedOnPositionChange = useMemo(() => {
    const { onPositionChange } = propsRef.current;
    if (!onPositionChange) return () => {};
    return debounce(onPositionChange, 150);
  }, [props.onPositionChange]);
    console.log(tourbuilderWrapperCode)

  const iframeUrl = useMemo(() => {
    // Import the plain JavaScript player file as raw text

    // CRITICAL: Import the COMPILED IIFE JavaScript bundle, NOT the source TypeScript file.

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
                
                if (props.node != null) tour.setStartNode(props.node);
                if (props.fov != null) tour.setFov(props.fov);
                if (props.pan != null) tour.setPan(props.pan);
                if (props.tilt != null) tour.setTilt(props.tilt);
                tour.setSingleImage(!!props.singleImage);

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