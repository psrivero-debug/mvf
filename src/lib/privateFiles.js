import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// ─── Archivos PRIVADOS ───────────────────────────────────────────────────────
// Todo lo que se sube a la app queda en almacenamiento privado: sin URL pública.
// Para leer un archivo (link, imagen, enviarlo a la IA) se genera una URL firmada temporal.

export async function subirArchivoPrivado(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}

// Devuelve una URL firmada temporal para leer el archivo.
// Compatibilidad: archivos viejos subidos como públicos (URL https) pasan tal cual.
export async function urlFirmada(fileRef, expiresIn = 3600) {
  if (!fileRef) return null;
  if (fileRef.startsWith("http://") || fileRef.startsWith("https://")) return fileRef;
  const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileRef, expires_in: expiresIn });
  return res.signed_url;
}

// Sube texto largo como .txt privado y devuelve la referencia "priv:<uri>"
export async function subirTextoLargo(texto, nombre) {
  if (!texto || texto.length <= 8000) return texto;
  const blob = new Blob([texto], { type: "text/plain" });
  const txtFile = new File([blob], `${nombre || "texto"}_${Date.now()}.txt`, { type: "text/plain" });
  const uri = await subirArchivoPrivado(txtFile);
  return `priv:${uri}`;
}

// Resuelve texto inline, URL pública vieja o referencia privada ("priv:<uri>") al texto real
export async function resolverTextoRef(texto) {
  if (!texto) return "";
  if (texto.startsWith("http://") || texto.startsWith("https://")) {
    try { return await fetch(texto).then(r => r.text()); } catch { return texto; }
  }
  if (texto.startsWith("priv:")) {
    try {
      const url = await urlFirmada(texto.slice(5));
      return url ? await fetch(url).then(r => r.text()) : texto;
    } catch { return texto; }
  }
  return texto;
}

// Hook: mapa de URLs firmadas para una lista de referencias de archivos
export function useUrlsFirmadas(refs) {
  const [map, setMap] = useState({});
  const key = (refs || []).join("|");
  useEffect(() => {
    let alive = true;
    (async () => {
      const lista = (refs || []).filter(Boolean);
      const entries = await Promise.all(lista.map(async (r) => [r, await urlFirmada(r)]));
      if (alive) setMap(Object.fromEntries(entries));
    })();
    return () => { alive = false; };
  }, [key]);
  return map;
}