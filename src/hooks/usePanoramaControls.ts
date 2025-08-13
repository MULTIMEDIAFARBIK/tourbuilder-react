import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import type { PanoramaProps, PanoPosition } from "../types";

/**
 * Handles pushing controlled prop changes (node, fov, pan, tilt, singleImage, transition)
 * into the underlying tour instance living inside the iframe.
 */
export function usePanoramaControls(
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  props: PanoramaProps | null,
  enabled: boolean = true,
) {
  // Keep a retry queue for position updates issued before pano is ready.
  const retryQueueRef = useRef<Array<{ key: keyof PanoPosition; value: number }>>([]);
  const retryTimerRef = useRef<number | null>(null);
  // Track when a node change is in-flight so we can defer orientation updates until after it finishes
  const nodeChangeInFlightRef = useRef(false);
  const pendingOrientationRef = useRef<Partial<Record<'fov' | 'pan' | 'tilt', number>>>({});
  const nodeChangeTimeoutRef = useRef<number | null>(null);

  const flushQueue = useCallback(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    const tourbuilder = (iframe.contentWindow as any).tour;
    const pano = tourbuilder?.pano;
    if (!pano) return; // Still not ready.
    const queue = retryQueueRef.current;
    if (!queue.length) return;
    // Deduplicate by keeping last value per key
    const latest: Record<string, number> = {};
    queue.forEach(item => { latest[item.key] = item.value; });
    retryQueueRef.current = [];
    (Object.keys(latest) as Array<keyof PanoPosition>).forEach(k => {
      switch (k) {
        case 'node':
          pano.openNext(`{node${latest[k]}}`);
          break;
        case 'fov':
          pano.setFov(latest[k]);
          break;
        case 'pan':
          pano.setPan(latest[k]);
          break;
        case 'tilt':
          pano.setTilt(latest[k]);
          break;
      }
    });
  }, [enabled, props, iframeRef]);

  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current != null) return; // already scheduled
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      flushQueue();
      // If still not flushed (pano not ready), schedule again
      if (retryQueueRef.current.length) scheduleRetry();
    }, 60); // retry roughly every frame
  }, [flushQueue]);

  const updatePosition = useCallback(
    (key: keyof PanoPosition, value: number) => {
      if (!enabled || !props) return; // respect gating
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      const tourbuilder = (iframe.contentWindow as any).tour;
      const pano = tourbuilder?.pano;
      if (!tourbuilder || !pano) {
        // Queue & retry once pano becomes ready. Push latest only (dedupe old queued same key)
        const existingIndex = retryQueueRef.current.findIndex(q => q.key === key);
        if (existingIndex >= 0) retryQueueRef.current.splice(existingIndex, 1);
        retryQueueRef.current.push({ key, value });
        scheduleRetry();
        return;
      }
      switch (key) {
        case "node":
          {
            const currentRaw = pano.getCurrentNode?.();
            const currentNodeNum = currentRaw ? parseInt(String(currentRaw).replace('node', '')) : undefined;
            if (currentNodeNum === value) {
              // Same node: we can flush any pending orientation immediately
              if (Object.keys(pendingOrientationRef.current).length) {
                if (pendingOrientationRef.current.fov != null) pano.setFov(pendingOrientationRef.current.fov);
                if (pendingOrientationRef.current.pan != null) pano.setPan(pendingOrientationRef.current.pan);
                if (pendingOrientationRef.current.tilt != null) pano.setTilt(pendingOrientationRef.current.tilt);
                pendingOrientationRef.current = {};
              }
              return;
            }
            nodeChangeInFlightRef.current = true;
            const handleNodeChanged = () => {
              nodeChangeInFlightRef.current = false;
              try {
                if (pendingOrientationRef.current.fov != null) pano.setFov(pendingOrientationRef.current.fov);
                if (pendingOrientationRef.current.pan != null) pano.setPan(pendingOrientationRef.current.pan);
                if (pendingOrientationRef.current.tilt != null) pano.setTilt(pendingOrientationRef.current.tilt);
              } finally {
                pendingOrientationRef.current = {};
                pano.removeListener?.('changenode', handleNodeChanged as any);
                if (nodeChangeTimeoutRef.current) {
                  clearTimeout(nodeChangeTimeoutRef.current);
                  nodeChangeTimeoutRef.current = null;
                }
              }
            };
            pano.addListener?.('changenode', handleNodeChanged as any);
            // Fallback timeout in case event does not fire
            nodeChangeTimeoutRef.current = window.setTimeout(handleNodeChanged, 1500);
            pano.openNext(`{node${value}}`);
          }
          break;
        case "fov":
          if (nodeChangeInFlightRef.current) {
            pendingOrientationRef.current.fov = value;
          } else {
            pano.setFov(value);
          }
          break;
        case "pan":
          if (nodeChangeInFlightRef.current) {
            pendingOrientationRef.current.pan = value;
          } else {
            pano.setPan(value);
          }
          break;
        case "tilt":
          if (nodeChangeInFlightRef.current) {
            pendingOrientationRef.current.tilt = value;
          } else {
            pano.setTilt(value);
          }
          break;
      }
    },
    [enabled, props, iframeRef, scheduleRetry],
  );

  // Individual effects for each controlled value (allow 0 values)
  useEffect(() => {
    if (!enabled || !props || props.node == null) return;
    updatePosition("node", props.node);
  }, [props?.node, enabled, updatePosition]);

  useEffect(() => {
    if (!enabled || !props || props.fov == null) return;
    updatePosition("fov", props.fov);
  }, [props?.fov, enabled, updatePosition]);

  useEffect(() => {
    if (!enabled || !props || props.pan == null) return;
    updatePosition("pan", props.pan);
  }, [props?.pan, enabled, updatePosition]);

  useEffect(() => {
    if (!enabled || !props || props.tilt == null) return;
    updatePosition("tilt", props.tilt);
  }, [props?.tilt, enabled, updatePosition]);

  // Single image toggle
  useEffect(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    if((iframe.contentWindow as any).tour?.pano) {
      (iframe.contentWindow as any).tour?.setActiveSingleImage(!!props.singleImage);
    }
  }, [props?.singleImage, iframeRef, enabled]);

  // Transition updates
  useEffect(() => {
    if (!enabled || !props) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    (iframe.contentWindow as any).tour?.pano?.setTransition(props.transition);
  }, [props?.transition, iframeRef, enabled]);

  return { updatePosition: enabled ? updatePosition : () => {} };
}
