import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { registerPasskey, authenticatePasskey } from "@/lib/passkey";
import { generateAccessKey } from "@/lib/access-key";
import { publicKeyToDid, buildDidDocument } from "@/lib/did";

function postToParent(type: string, payload: unknown) {
  if (window.parent !== window) {
    window.parent.postMessage({ source: "midnightos-passkeys", type, payload }, "*");
  }
}

/**
 * Uses IntersectionObserverV2 to detect if the iframe is being obscured
 * by a parent overlay (clickjacking). Returns whether the element is
 * fully visible. If the browser doesn't support IOv2's `trackVisibility`,
 * we fall back to allowing (since the passkey prompt itself is
 * browser-controlled and phishing-resistant).
 */
function useVisibilityCheck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    try {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // IOv2 provides isVisible when trackVisibility is true
            if ("isVisible" in entry) {
              setSupported(true);
              setVisible(entry.isVisible as boolean);
            }
          }
        },
        {
          threshold: [1.0],
          // IOv2 options — requires a delay of at least 100ms
          trackVisibility: true,
          delay: 100,
        } as IntersectionObserverInit,
      );

      observer.observe(el);
      return () => observer.disconnect();
    } catch {
      // Browser doesn't support IOv2, fall back to allowing
      setSupported(false);
      setVisible(true);
    }
  }, []);

  return { containerRef, visible, supported };
}

export function EmbedAuth() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("midnight-user");
  const { containerRef, visible, supported } = useVisibilityCheck();

  const obscured = supported && !visible;

  // Listen for commands from the parent
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (data?.source !== "midnightos-dapp") return;

      if (data.type === "register") {
        handleRegister(data.payload?.username ?? "midnight-user");
      } else if (data.type === "sign-in") {
        handleSignIn(data.payload?.credentialId);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });

  const handleRegister = useCallback(
    async (name?: string) => {
      if (obscured) {
        window.open(window.location.href.replace("/embed", ""), "_blank");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const cred = await registerPasskey(name ?? username);
        const accessKey = await generateAccessKey();
        const did = publicKeyToDid(accessKey.publicKeyCompressed);
        const didDocument = buildDidDocument(did, accessKey.publicKeyRaw);

        postToParent("authenticated", {
          credential: cred,
          did,
          didDocument,
          accessKeyPublicKey: accessKey.publicKeyHex,
        });
        setDone(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Registration failed";
        setError(msg);
        postToParent("error", { message: msg });
      } finally {
        setLoading(false);
      }
    },
    [username, obscured],
  );

  const handleSignIn = useCallback(async (credentialId?: string) => {
    if (obscured) {
      window.open(window.location.href.replace("/embed", ""), "_blank");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await authenticatePasskey(credentialId);
      const accessKey = await generateAccessKey();
      const did = publicKeyToDid(accessKey.publicKeyCompressed);
      const didDocument = buildDidDocument(did, accessKey.publicKeyRaw);

      postToParent("authenticated", {
        credential: cred,
        did,
        didDocument,
        accessKeyPublicKey: accessKey.publicKeyHex,
      });
      setDone(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      setError(msg);
      postToParent("error", { message: msg });
    } finally {
      setLoading(false);
    }
  }, [obscured]);

  // Signal to the parent that the embed is ready
  useEffect(() => {
    postToParent("ready", {});
  }, []);

  if (done) {
    return (
      <div ref={containerRef} className="p-4 space-y-2">
        <p className="text-sm font-medium">Authenticated</p>
        <p className="text-xs text-muted-foreground">
          You can close this window. Your credentials have been sent to the application.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-4 space-y-3">
      {obscured && (
        <p className="text-xs text-destructive font-medium">
          This iframe appears to be obscured. For security, authentication
          will open in a new window.
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="embed-username" className="text-xs text-muted-foreground">
          Username
        </label>
        <input
          id="embed-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex h-8 w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={() => handleRegister()} disabled={loading || !username}>
          {loading ? "Waiting..." : "Register"}
        </Button>
        <Button variant="outline" onClick={() => handleSignIn()} disabled={loading}>
          {loading ? "Waiting..." : "Sign In"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Powered by passkeys.rvcas.dev
      </p>
    </div>
  );
}
