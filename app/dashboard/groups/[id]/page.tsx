import { GroupDashboard } from "./group-dashboard";

interface PageProps {
  params: { id: string }; // تصحيح: 
}

export default function GroupPage({ params }: PageProps) {
  // تصحيح
  return <GroupDashboard groupId={params.id} />;
}
