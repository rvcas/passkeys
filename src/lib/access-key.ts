export type AccessKey = {
  publicKeyRaw: ArrayBuffer; // 65 bytes uncompressed
  publicKeyCompressed: Uint8Array; // 33 bytes compressed
  publicKeyHex: string;
  privateKey: CryptoKey;
};

type StoredAccessKey = {
  jwk: JsonWebKey;
  publicKeyHex: string;
};

const STORAGE_PREFIX = "midnightos-access-key-";

export async function generateAccessKey(): Promise<AccessKey> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  return buildAccessKey(keyPair);
}

export async function getOrCreateAccessKey(credentialId: string): Promise<AccessKey> {
  const stored = loadStoredAccessKey(credentialId);
  if (stored) {
    return importAccessKey(stored.jwk);
  }

  const accessKey = await generateAccessKey();
  await saveAccessKey(credentialId, accessKey);
  return accessKey;
}

async function buildAccessKey(keyPair: CryptoKeyPair): Promise<AccessKey> {
  const rawPubKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const compressed = compressP256PublicKey(rawPubKey);
  const hex = bufferToHex(rawPubKey);

  return {
    publicKeyRaw: rawPubKey,
    publicKeyCompressed: compressed,
    publicKeyHex: hex,
    privateKey: keyPair.privateKey,
  };
}

async function importAccessKey(jwk: JsonWebKey): Promise<AccessKey> {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );

  // Derive public key from private JWK (remove d parameter)
  const publicJwk = { ...jwk, d: undefined, key_ops: ["verify"] };
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );

  const rawPubKey = await crypto.subtle.exportKey("raw", publicKey);
  const compressed = compressP256PublicKey(rawPubKey);
  const hex = bufferToHex(rawPubKey);

  return {
    publicKeyRaw: rawPubKey,
    publicKeyCompressed: compressed,
    publicKeyHex: hex,
    privateKey,
  };
}

async function saveAccessKey(credentialId: string, accessKey: AccessKey): Promise<void> {
  const jwk = await crypto.subtle.exportKey("jwk", accessKey.privateKey);
  const stored: StoredAccessKey = {
    jwk,
    publicKeyHex: accessKey.publicKeyHex,
  };
  localStorage.setItem(STORAGE_PREFIX + credentialId, JSON.stringify(stored));
}

function loadStoredAccessKey(credentialId: string): StoredAccessKey | null {
  const raw = localStorage.getItem(STORAGE_PREFIX + credentialId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAccessKey;
  } catch {
    return null;
  }
}

export function compressP256PublicKey(rawPublicKey: ArrayBuffer): Uint8Array {
  const uncompressed = new Uint8Array(rawPublicKey);
  const x = uncompressed.slice(1, 33);
  const y = uncompressed.slice(33, 65);
  const prefix = (y[31]! & 1) === 0 ? 0x02 : 0x03;
  const compressed = new Uint8Array(33);
  compressed[0] = prefix;
  compressed.set(x, 1);
  return compressed;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return (
    "0x" +
    [...new Uint8Array(buffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
