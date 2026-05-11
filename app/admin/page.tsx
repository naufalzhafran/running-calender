import { AdminDashboardClient } from "@/app/admin/admin-dashboard-client";
import { listEvents } from "@/lib/data";

export default async function AdminDashboard() {
  const events = await listEvents();

  return <AdminDashboardClient events={events} />;
}
