import { GroupStudentsLoader } from "@/components/groups/group-students-loader";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupStudentsLoader groupId={groupId} />;
}
