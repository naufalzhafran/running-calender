import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type SiteHeaderProps = {
  backHref?: string;
  backLabel?: string;
};

function BrandLink({ compact }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 rounded-xl"
      aria-label={compact ? "Kalender Lari, ke beranda" : undefined}
    >
      <Image
        src="/logo-mark.svg"
        alt=""
        width={40}
        height={40}
        unoptimized
        className={compact ? "h-8 w-8 shrink-0" : "h-10 w-10 shrink-0"}
        priority
      />
      {!compact && (
        <span>
          <span className="block text-xl font-bold leading-tight text-foreground">
            Kalender Lari
          </span>
          <span className="block text-xs text-muted-foreground">
            Jadwal event lari di Indonesia
          </span>
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({ backHref, backLabel = "Kembali" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-4 px-4 py-3">
        {backHref ? (
          <>
            <Link
              href={backHref}
              className="-ml-2 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
              {backLabel}
            </Link>
            <BrandLink compact />
          </>
        ) : (
          <BrandLink />
        )}
      </div>
    </header>
  );
}
