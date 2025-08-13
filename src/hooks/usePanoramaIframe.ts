import { useEffect, useMemo, useRef } from "react";
import { PanoramaProps, PanoramaSerializableProps } from "../types";
import { buildIframeHtml } from "../utils/buildIframeHtml";

/**
 * Creates & manages the iframe blob URL. Only regenerates when basepath changes
 * to avoid full reinitialization on every controlled prop update.
 */
export function usePanoramaIframe(props: PanoramaProps | null): string | null {
  const propsRef = useRef<PanoramaProps | null>(props);
  propsRef.current = props;

  const iframeUrl = useMemo(() => {
    if (!propsRef.current) return null;
    const serializable: PanoramaSerializableProps = { ...(propsRef.current as PanoramaProps) };
    delete (serializable as any).children;
    delete (serializable as any).onPositionChange;
    const html = buildIframeHtml(serializable);
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [props?.basepath]);

  // Cleanup blob URL when dependency changes or component unmounts
  useEffect(() => {
    if (!iframeUrl) return;
    return () => URL.revokeObjectURL(iframeUrl);
  }, [iframeUrl]);

  return iframeUrl;
}
