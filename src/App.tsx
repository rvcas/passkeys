import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="center">
        <div>
          <h1>Passkeys</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button type="button" className="counter" onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
      </section>
    </>
  );
}
