import { GroupDashboard } from "./group-dashboard";

// ────────────────────────────────────────────────────────────
// Next.js 15: params is a Promise that must be awaited.
// Next.js 14: params is a plain object — remove the await
//             and change the type to { params: { id: string } }.
// ────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: PageProps) {
  const { id } = await params;

  return <GroupDashboard groupId={id} />;
}