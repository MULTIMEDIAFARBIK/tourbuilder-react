import { useEffect, useMemo, useRef } from "react";
import { PanoramaProps, PanoramaSerializableProps } from "../types";
import { buildIframeHtml } from "../utils/buildIframeHtml";

/**
 * Creates & manages the iframe blob URL. Only regenerates when basepath changes
 * to avoid full reinitialization on every controlled prop update.
 */
export function usePanoramaIframe(props: PanoramaProps) {
  const propsRef = useRef(props);
  propsRef.current = props;

  const iframeUrl = useMemo(() => {
    const serializable: PanoramaSerializableProps = { ...propsRef.current };
    // Remove non-serializable fields
    delete (serializable as any).children;
    delete (serializable as any).onPositionChange;
    const html = buildIframeHtml(serializable);
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
    // Only rebuild when basepath changes to keep previous pano state otherwise
  }, [props.basepath]);

  // Cleanup blob URL when dependency changes or component unmounts
  useEffect(() => {
    return () => URL.revokeObjectURL(iframeUrl);
  }, [iframeUrl]);

  return iframeUrl;
}
