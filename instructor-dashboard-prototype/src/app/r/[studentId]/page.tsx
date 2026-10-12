import { InstructorDashboard } from "@/components/InstructorDashboard";

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <InstructorDashboard initialReportId={studentId} />;
}
