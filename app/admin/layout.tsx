import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

async function AdminAuthGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const admin = await requireAdmin();

  if (!admin) {
    redirect("/login");
  }

  return children;
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminAuthGate>{children}</AdminAuthGate>
    </Suspense>
  );
}
