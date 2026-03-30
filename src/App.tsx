import { useState } from "react";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Header />
      <Home />
    </ThemeProvider>
  );
}

function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 pt-14">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            Edit <code className="rounded bg-muted px-1.5 py-0.5 text-xs">src/App.tsx</code> and
            save to test HMR
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-4xl font-bold tabular-nums">{count}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCount(0)}>
              Reset
            </Button>
            <Button onClick={() => setCount((c) => c + 1)}>Increment</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
