import Link from "next/link";
import { listEvents } from "@/lib/data";
import { Event } from "@/types";
import { Calendar, MapPin, Footprints } from "lucide-react";
import {
  formatDateInJakarta,
  getDaysUntilDate,
} from "@/lib/date";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<Event[]> {
  return listEvents();
}

function getEventStatus(eventDate: string) {
  const diffDays = getDaysUntilDate(eventDate);

  if (diffDays < 0) return { label: "Selesai", variant: "completed" as const };
  if (diffDays <= 7) return { label: "Minggu Ini", variant: "this-week" as const };
  if (diffDays <= 30) return { label: "Coming Soon", variant: "soon" as const };
  return { label: "", variant: "upcoming" as const };
}

export default async function Home() {
  const events = await getEvents();
  const upcomingEvents = events.filter((e) => getDaysUntilDate(e.event_date) >= 0);
  const pastEvents = events.filter((e) => getDaysUntilDate(e.event_date) < 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Kalender Lari</h1>
              <p className="text-xs text-muted-foreground">Indonesia Running Events</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <p className="text-2xl font-bold text-primary">{upcomingEvents.length}</p>
            <p className="text-sm text-muted-foreground">Event Mendatang</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <p className="text-2xl font-bold text-muted-foreground">{pastEvents.length}</p>
            <p className="text-sm text-muted-foreground">Event Selesai</p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground" /></div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Belum Ada Event</h2>
            <p className="text-muted-foreground text-center max-w-xs">
              Saat ini belum ada jadwal lomba lari. Stay tuned untuk upcoming events!
            </p>
          </div>
        ) : (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              {upcomingEvents.length > 0 ? "Event Mendatang" : "Semua Event"}
            </h2>
            
            <div className="space-y-4">
              {events.map((event, index) => {
                const status = getEventStatus(event.event_date);
                const isPast = status.variant === "completed";
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className={`block animate-fade-in-up stagger-${Math.min(index + 1, 6)} ${isPast ? "opacity-60" : ""}`}
                    style={{ opacity: 0 }}
                  >
                    <article className="bg-card rounded-2xl border border-border/50 overflow-hidden card-hover cursor-pointer">
                      {/* Date Badge */}
                      <div className="flex items-stretch">
                        <div className="w-16 sm:w-20 bg-primary/5 flex flex-col items-center justify-center py-3 sm:py-4 border-r border-border/30">
                          <span className="text-xs font-medium text-primary uppercase">
                            {formatDateInJakarta(event.event_date, { month: "short" })}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-primary leading-none">
                            {formatDateInJakarta(event.event_date, { day: "numeric" })}
                          </span>
                        </div>
                        
                        <div className="flex-1 p-4 sm:p-5">
                          {/* Status Badge */}
                          {status.label && (
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${
                              status.variant === "completed" 
                                ? "bg-muted text-muted-foreground"
                                : status.variant === "this-week"
                                ? "bg-amber-100 text-amber-700"
                                : status.variant === "soon"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {status.label}
                            </span>
                          )}
                          
                          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 text-base sm:text-lg">
                            {event.title}
                          </h3>
                          
                          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Distances Preview */}
                        <div className="hidden sm:flex flex-col items-center justify-center px-4 border-l border-border/30 min-w-[80px]">
                          {Array.isArray(event.distance) && event.distance.length > 0 && (
                            <>
                              <span className="text-xs text-muted-foreground mb-1">
                                {event.distance.length} kategori
                              </span>
                              <div className="flex gap-1">
                                {event.distance.slice(0, 3).map((d, i) => (
                                  <span 
                                    key={i} 
                                    className="w-2 h-2 rounded-full bg-primary/60"
                                    title={d.name}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Mobile: Distance Pills */}
                      {Array.isArray(event.distance) && event.distance.length > 0 && (
                        <div className="sm:hidden px-4 pb-4 pt-1 border-t border-border/30 flex flex-wrap gap-2">
                          {event.distance.slice(0, 4).map((d, i) => (
                            <span 
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                            >
                              {d.name.trim()}
                            </span>
                          ))}
                          {event.distance.length > 4 && (
                            <span className="text-xs px-2 py-1 text-muted-foreground">
                              +{event.distance.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
