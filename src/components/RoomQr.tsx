import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Código QR que codifica un link para unirse directo a la sala (?join=CÓDIGO). */
export function RoomQr({ value, size = 160 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2, // el doble de resolución para que se vea nítido en pantallas retina
      margin: 1,
      color: { dark: "#241c4a", light: "#f5f3fa" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          background: "var(--surface-2)",
        }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Código QR para unirse a la sala"
      width={size}
      height={size}
      style={{ borderRadius: 12, background: "#f5f3fa", padding: 8 }}
    />
  );
}
