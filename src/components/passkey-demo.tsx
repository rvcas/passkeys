import { useState } from "react";
import type { PasskeyCredential } from "@/lib/passkey";
import type { AccessKey } from "@/lib/access-key";
import { RegisterStep } from "@/components/steps/register-step";
import { AccessKeyStep } from "@/components/steps/access-key-step";
import { DidStep } from "@/components/steps/did-step";

export function PasskeyDemo() {
  const [credential, setCredential] = useState<PasskeyCredential | null>(null);
  const [accessKey, setAccessKey] = useState<AccessKey | null>(null);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold">
          midnightOS Passkey Demo
        </h1>
        <p className="text-sm text-muted-foreground">
          Proof of concept: passkey root key → access key → DID credential
        </p>
      </div>

      <RegisterStep credential={credential} onComplete={setCredential} />

      {credential && (
        <AccessKeyStep
          credentialId={credential.credentialId}
          accessKey={accessKey}
          onComplete={setAccessKey}
        />
      )}

      {accessKey && <DidStep accessKey={accessKey} />}
    </div>
  );
}
