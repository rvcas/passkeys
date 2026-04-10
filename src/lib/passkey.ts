import { Registration, Authentication } from "webauthx/client";
import * as api from "./api";

export type PasskeyCredential = {
  credentialId: string;
  publicKey: string; // hex-encoded P-256 public key (root key)
};

export type KeyAuthorization = {
  rootPublicKey: string;
  accessKeyPublicKey: string;
  credentialId: string;
  authorizedAt: number;
};

export async function registerPasskey(
  username: string,
): Promise<PasskeyCredential> {
  const { sessionId, options } = await api.registerOptions(username);

  const credential = await Registration.create({
    options: options as never,
  });

  const result = await api.registerVerify(sessionId, credential);
  if (result.error) throw new Error(result.error);

  return {
    credentialId: result.credentialId,
    publicKey: result.publicKey,
  };
}

export async function authenticatePasskey(
  credentialId?: string,
): Promise<PasskeyCredential> {
  const { sessionId, options } = await api.authOptions(credentialId);

  const response = await Authentication.sign({
    options: options as never,
  });

  const result = await api.authVerify(sessionId, response);
  if (result.error) throw new Error(result.error);
  if (!result.valid) throw new Error("Authentication failed");

  return {
    credentialId: result.credentialId!,
    publicKey: result.publicKey!,
  };
}

/**
 * Authorize an access key using the passkey (root key).
 * The passkey signs a challenge that contains the access key's public key,
 * creating a cryptographic proof of delegation.
 */
export async function authorizeAccessKey(
  credentialId: string,
  accessKeyPublicKey: string,
): Promise<KeyAuthorization> {
  // Get a challenge that commits to the access key public key
  const { sessionId, options } = await api.authorizeKeyOptions(
    credentialId,
    accessKeyPublicKey,
  );

  // Passkey signs the challenge (biometric prompt)
  const response = await Authentication.sign({
    options: options as never,
  });

  // Server verifies the passkey signature and stores the authorization
  const result = await api.authorizeKeyVerify(sessionId, response);
  if (result.error) throw new Error(result.error);
  if (!result.authorized || !result.authorization)
    throw new Error("Authorization failed");

  return result.authorization;
}
