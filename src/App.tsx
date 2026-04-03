import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { PasskeyDemo } from "@/components/passkey-demo";
import { EmbedAuth } from "@/components/embed-auth";

function isEmbed() {
  return window.location.pathname === "/embed";
}

export function App() {
  if (isEmbed()) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <EmbedAuth />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Header />
      <div className="min-h-svh bg-background pt-14">
        <PasskeyDemo />
      </div>
    </ThemeProvider>
  );
}
