import type { AgentSplitPose } from "@/components/ui/empty-states/agent-split-illustration";

// ─── Types ──────────────────────────────────────────────
export interface EmptyStateContent {
  pose: AgentSplitPose;
  animationUrl?: string;
  title: string;
  description: string;
  actionLabel?: string;
  secondaryLabel?: string;
  lottiePrompt: string; // For designer/AI reference
}

// ─── Content Map ────────────────────────────────────────
export const EMPTY_STATE_CONTENT: Record<string, EmptyStateContent> = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1️⃣  GROUPS LIST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  groups: {
    pose: "bored",
    animationUrl: "/animations/agent-split-bored.lottie",
    title: "No Squad? No Problem… Actually, It's a Problem.",
    description:
      "Agent Split is sitting here, sharpening his receipts, waiting for you to create your first group. Every great heist — I mean, dinner split — starts with a crew.",
    actionLabel: "Create a Group",
    secondaryLabel: "Join with invite",
    lottiePrompt:
      "A masked ninja character in a dark indigo hoodie sitting on a ledge, chin resting on one hand, foot tapping impatiently. Large expressive white eyes are half-lidded showing boredom. A thought bubble with '...' floats above. Flat vector style, soft gray background, looping animation.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2️⃣  FRIENDS LIST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  friends: {
    pose: "searching",
    animationUrl: "/animations/agent-split-search.lottie",
    title: "Zero Friends Found. We Won't Judge. (Much.)",
    description:
      "Agent Split has been searching everywhere — under the couch cushions, behind the fridge, in your DMs. Add some friends so he can stop pretending to look busy.",
    actionLabel: "Find Friends",
    secondaryLabel: "Share invite link",
    lottiePrompt:
      "A masked ninja character in a dark indigo hoodie holding a comically oversized magnifying glass, peering through it theatrically. Wide white eyes visible through the glass lens appear huge. Question marks float nearby. Flat vector style, smooth looping search animation.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3️⃣  EXPENSES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  expenses: {
    pose: "coin-flip",
    animationUrl: "/animations/agent-split-coin.lottie",
    title: "No Expenses? Either You're a Monk or You Forgot.",
    description:
      "The ledger is emptier than Agent Split's social calendar. Start tracking expenses before your friends start 'conveniently forgetting' who paid for dinner.",
    actionLabel: "Add an Expense",
    lottiePrompt:
      "A masked ninja character in a dark indigo hoodie casually flipping a gold coin in the air with one hand while shrugging with the other. An empty money bag with a '$' sits nearby. The coin rotates and glints as it arcs up and down. Flat vector style, smooth loop.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4️⃣  NOTIFICATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  notifications: {
    pose: "relaxed",
    animationUrl: "/animations/agent-split-relax.lottie",
    title: "Inbox Zero. Chef's Kiss. 🤌",
    description:
      "Nothing to see here, and Agent Split couldn't be prouder. No pings, no nudges, no passive-aggressive payment reminders. This is what peak adulting looks like.",
    secondaryLabel: "Back to Dashboard",
    lottiePrompt:
      "A masked ninja character in a dark indigo hoodie leaning back in a chair with feet propped up, giving a dramatic thumbs up with a satisfied expression (happy squinting white eyes). Z's float above suggesting peaceful relaxation. Flat vector style, gentle breathing/bobbing loop.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5️⃣  SETTLEMENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  settlements: {
    pose: "mic-drop",
    animationUrl: "/animations/agent-split-mic-drop.lottie",
    title: "All Squared Up. Mic Drop. 🎤",
    description:
      "Zero outstanding debts. Agent Split just did a victory lap around your balance sheet. You and your friends have achieved financial harmony. It's… beautiful.",
    secondaryLabel: "View Groups",
    lottiePrompt:
      "A masked ninja character in a dark indigo hoodie standing confidently with one hand on hip, the other arm extended and releasing/dropping a small bag of gold coins. Sparkle effects and impact lines appear at the drop point. One eye slightly smaller suggesting a smug wink. Flat vector style, dramatic mic-drop loop.",
  },
};