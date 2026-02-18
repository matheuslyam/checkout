// src/App.tsx
// Root application shell — renders the Bitstrum visual engine.

import Bitstrum from "./components/Bitstrum";

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Bitstrum />
    </main>
  );
}
