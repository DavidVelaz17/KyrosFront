import { del, get, set } from "idb-keyval";
import { getCacheKeyMaterial } from "@/lib/auth/cache-key";

/** Llave de IndexedDB donde se guarda la llave de cifrado de la sesión activa. */
const CACHE_KEY_STORAGE_KEY = "kyros:cache-key";

interface StoredCacheKey {
  userId: number;
  /** No extraíble: el navegador la puede usar para cifrar/descifrar pero nunca la expone. */
  key: CryptoKey;
}

interface EncryptedPayload {
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

/** Cuando está en true (tras cerrar sesión) ya no se escribe nada al disco: si no, al vaciar la
 *  memoria en el logout se guardaría una copia vacía encima de la cifrada del día. */
let locked = false;

/** WebCrypto solo existe en contextos seguros (HTTPS o localhost). Sin él no se guarda nada en
 *  disco y la app trabaja solo con el caché en memoria. */
function hasWebCrypto(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

/** Habilita de nuevo la escritura al disco; la llama el QueryProvider al montarse (inicio de sesión). */
export function unlockClientCache() {
  locked = false;
}

/** Llave de cifrado de este usuario: la guardada en el equipo durante la sesión, o si no hay (recién
 *  iniciada la sesión), la que entrega el servidor. null si no se puede obtener (sin conexión y sin
 *  llave guardada, o navegador sin WebCrypto): entonces no se lee ni se escribe la copia en disco. */
export async function loadCacheKey(userId: number): Promise<CryptoKey | null> {
  if (!hasWebCrypto()) return null;

  const stored = await get<StoredCacheKey>(CACHE_KEY_STORAGE_KEY).catch(() => undefined);
  if (stored && stored.userId === userId) return stored.key;

  try {
    const material = await getCacheKeyMaterial();
    const bytes = Uint8Array.from(atob(material), (char) => char.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
    await set(CACHE_KEY_STORAGE_KEY, { userId, key } satisfies StoredCacheKey).catch(() => undefined);
    return key;
  } catch {
    return null;
  }
}

export async function encryptForCache(key: CryptoKey, text: string): Promise<EncryptedPayload | null> {
  if (locked) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return { iv, data };
}

/** null si no se puede descifrar: la copia es de otro usuario, de un secreto anterior, o del
 *  formato viejo sin cifrar. */
export async function decryptFromCache(key: CryptoKey, payload: unknown): Promise<string | null> {
  const candidate = payload as Partial<EncryptedPayload> | null;
  if (!candidate || !(candidate.iv instanceof Uint8Array) || !(candidate.data instanceof ArrayBuffer)) return null;
  try {
    const iv = new Uint8Array(candidate.iv);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, candidate.data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** Al cerrar sesión: el navegador olvida la llave y deja de escribir al disco. La copia cifrada se
 *  queda en el equipo pero es ilegible hasta que ese usuario vuelva a iniciar sesión. */
export async function lockClientCache(): Promise<void> {
  locked = true;
  await del(CACHE_KEY_STORAGE_KEY).catch(() => undefined);
}
