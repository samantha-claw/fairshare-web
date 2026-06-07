// 🎉 Confetti utility for celebrations
import confetti from "canvas-confetti";

/** Fire a settlement celebration burst */
export function fireSettlementConfetti() {
  // First burst — center
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f59e0b"],
  });

  // Second burst — left
  setTimeout(() => {
    confetti({
      particleCount: 35,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
    });
  }, 200);

  // Third burst — right
  setTimeout(() => {
    confetti({
      particleCount: 35,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#f59e0b", "#fbbf24", "#fde68a"],
    });
  }, 350);
}

/** Fire a subtle success burst (expense added, etc.) */
export function fireSuccessConfetti() {
  confetti({
    particleCount: 25,
    spread: 50,
    origin: { y: 0.75 },
    colors: ["#10b981", "#34d399"],
    scalar: 0.8,
    gravity: 1.2,
    drift: 0,
    ticks: 50,
  });
}
