import { AdminMetricsCardsSkeleton, AdminTableSkeleton } from "@/components/admin/AdminSkeletons";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 animate-pulse">
        <div className="h-7 w-52 bg-gray-200 rounded-lg" />
        <div className="h-4 w-80 bg-gray-200/70 rounded-lg" />
      </div>
      <AdminMetricsCardsSkeleton count={4} />
      <AdminTableSkeleton
        columns={["Item", "Category", "Status", "Total", "Actions"]}
        rows={6}
      />
    </div>
  );
}
