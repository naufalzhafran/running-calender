import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Kamu sedang offline</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Kalender Lari sudah terpasang sebagai PWA. Sambungkan internet lagi
          untuk memuat daftar event terbaru.
        </p>
        <Button asChild className="mt-6 rounded-2xl">
          <Link href="/">Coba Lagi</Link>
        </Button>
      </div>
    </main>
  );
}
