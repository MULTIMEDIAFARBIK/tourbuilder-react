import { PanoramaSerializableProps } from "../types";

// These globals are replaced at build-time by the bundler configuration
declare const __WRAPPER_CODE__: string;

/**
 * Builds the full HTML string injected into the panorama iframe.
 * Keep this pure & deterministic for easier testing.
 */
export function buildIframeHtml(props: PanoramaSerializableProps) {
  const serializedProps = JSON.stringify(props);
  const wrapperCode = __WRAPPER_CODE__;
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Panorama</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body, #tour-container { position: relative; margin:0; padding:0; width:100%; height:100%; overflow:hidden; }
      #children-container { position:absolute; inset:0; }
    </style>
  </head>
  <body>
    <div id="tour-container">
      <div id="children-container"></div>
    </div>
    <script>${wrapperCode}</script>
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

          const positionListener = () => {
            if (!tour.pano) return;
            const pos = {
              basepath: tour.pano.getBasePath(),
              node: parseInt(tour.pano.getCurrentNode().replace('node', '')),
              fov: Math.round(tour.pano.getFov() * 100) / 100,
              pan: Math.round(tour.pano.getPan() * 100) / 100,
              tilt: Math.round(tour.pano.getTilt() * 100) / 100,
            };
            if (window.reportPosition) {
              window.reportPosition(pos);
            } else {
              window.__lastPanoPosition = pos; // cache until callback injected
            }
          };

          tour.init().then(() => {
            if (tour.pano) {
              tour.pano.stopAutorotate();
              if (props.transition) tour.pano.setTransition(props.transition);
              tour.pano.addListener('positionchanged', positionListener);
              tour.pano.addListener('changenode', positionListener);
              tour.pano.addListener('imagesready', () => {
                if (window.__imagesReady) {
                  try { window.__imagesReady(); } catch(e) { console.error(e); }
                }
              });
              // Fire an initial position once after everything is set up so parent gets initial state.
              try { positionListener(); } catch(e) { console.error(e); }
            }
          });
        } catch (e) {
          console.error('Error initializing tour inside iframe:', e);
        }
      });
    </script>
  </body>
</html>`;
}
