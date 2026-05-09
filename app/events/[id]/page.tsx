import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/data";
import { Event } from "@/types";
import { Calendar, MapPin, Ruler, ArrowLeft, Clock, ImageIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { buildWallpaperSharePath } from "@/lib/wallpaper";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";

export const dynamic = "force-dynamic";

async function getEvent(id: string): Promise<Event | null> {
  return getEventById(id);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const isPast = getDaysUntilDate(event.event_date) < 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="bg-card rounded-3xl border border-border/50 overflow-hidden mb-6">
          {/* Status Banner */}
          {isPast && (
            <div className="bg-muted px-6 py-2 text-center text-sm text-muted-foreground">
              Event telah selesai
            </div>
          )}
          
          <div className="p-6 sm:p-8">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(event.distance) &&
                event.distance.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                  >
                    {d.name.trim()}
                  </span>
                ))}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6 tracking-tight">
              {event.title}
            </h1>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Tanggal
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatDateInJakarta(event.event_date, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {event.end_date && (
                      <>
                        <span className="mx-2 text-muted-foreground">—</span>
                        {formatDateInJakarta(event.end_date, {
                          day: "numeric",
                          month: "long",
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Lokasi
                  </p>
                  <p className="font-semibold text-foreground">
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Categories Section */}
            {Array.isArray(event.distance) && event.distance.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Kategori
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {event.distance.map((dist, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/20"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-xl text-foreground">
                            {dist.name}
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Kategori Race
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-2">
                        <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Tanggal
                          </span>
                          <span className="font-medium text-foreground">
                            {dist.date
                              ? formatDateInJakarta(dist.date, {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-border/50 py-3 text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Start
                          </span>
                          <span className="font-medium text-foreground">
                            {dist.start_time || "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 py-3 text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            COT
                          </span>
                          <span className="font-medium text-foreground">
                            {dist.cot || "-"}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={buildWallpaperSharePath({
                          eventId: event.id,
                          distance: dist.name,
                        })}
                        className={buttonVariants({
                          className: "mt-5 h-11 w-full rounded-2xl",
                        })}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Buka Wallpaper Preview
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="border-t border-border/50 pt-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Deskripsi
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
