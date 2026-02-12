import Link from "next/link";
import { query } from "@/lib/db";
import { Event } from "@/types";
import { Calendar, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<Event[]> {
  const res = await query<Event>("SELECT * FROM events ORDER BY event_date ASC");
  return res.rows;
}

export default async function Home() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kalender Lari</h1>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-lg text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Belum ada event</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Belum ada jadwal lomba lari yang tersedia saat ini. Cek kembali
              nanti.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group block h-full focus:outline-none"
              >
                <Card className="h-full transition-colors hover:bg-md-surface-container-high/50 hover:border-md-primary/50">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(event.distance) &&
                          event.distance.map((d, i) => (
                            <Badge key={i} variant="secondary">
                              {d.name.trim()}
                            </Badge>
                          ))}
                      </div>
                      {new Date(event.event_date) < new Date() && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                        >
                          Selesai
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {new Date(event.event_date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                          {event.end_date && (
                            <>
                              {" - "}
                              {new Date(event.end_date).toLocaleDateString(
                                "id-ID",
                                { day: "numeric", month: "long" },
                              )}
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
