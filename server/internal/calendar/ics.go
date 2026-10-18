// Package calendar builds iCalendar (.ics) files with race-day reminders.
package calendar

import (
	"strings"
	"time"
	"unicode/utf8"

	"running-calendar/internal/events"
	"running-calendar/internal/jakarta"
)

var icsEscaper = strings.NewReplacer(`\`, `\\`, "\n", `\n`, ",", `\,`, ";", `\;`)

func toICSDateTime(date, clock string) string {
	return strings.ReplaceAll(date, "-", "") + "T" + strings.ReplaceAll(clock, ":", "") + "00"
}

// fold splits lines longer than 74 octets per RFC 5545 without breaking
// multi-byte characters.
func fold(line string) string {
	if len(line) <= 74 {
		return line
	}
	var b strings.Builder
	width := 0
	for _, r := range line {
		n := utf8.RuneLen(r)
		if width+n > 74 {
			b.WriteString("\r\n ")
			width = 1
		}
		b.WriteRune(r)
		width += n
	}
	return b.String()
}

func description(ev events.Event, d events.Distance) string {
	lines := []string{
		ev.Title + " - " + d.Name,
		"Tanggal: " + jakarta.LongDate(d.Date),
		"Lokasi: " + ev.Location,
	}
	if d.StartTime != nil {
		lines = append(lines, "Start: "+*d.StartTime)
	}
	if d.COT != nil {
		lines = append(lines, "COT: "+*d.COT)
	}
	if ev.Description != nil {
		lines = append(lines, *ev.Description)
	}
	return strings.Join(lines, "\n")
}

// Build returns an .ics document for ev. When distance is set only the
// matching distance is included; an event without distances gets one entry.
func Build(ev events.Event, distance string) string {
	distances := ev.Distances
	if want := events.NormalizeName(distance); want != "" {
		distances = nil
		for _, d := range ev.Distances {
			if events.NormalizeName(d.Name) == want {
				distances = append(distances, d)
			}
		}
	} else if len(distances) == 0 {
		start := "06:00"
		distances = []events.Distance{{Name: "Event", Date: ev.EventDate, StartTime: &start}}
	}

	stamp := time.Now().UTC().Format("20060102T150405Z")
	lines := []string{
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Kalender Lari//Event Reminders//ID",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
	}
	for _, d := range distances {
		start := "06:00"
		if d.StartTime != nil {
			start = *d.StartTime
		}
		summary := ev.Title + " - " + d.Name
		lines = append(lines,
			"BEGIN:VEVENT",
			"UID:"+ev.Slug+"-"+events.CreateSlug(d.Name)+"@kalender-lari",
			"DTSTAMP:"+stamp,
			"DTSTART;TZID=Asia/Jakarta:"+toICSDateTime(d.Date, start),
			"SUMMARY:"+icsEscaper.Replace(summary),
			"LOCATION:"+icsEscaper.Replace(ev.Location),
			"DESCRIPTION:"+icsEscaper.Replace(description(ev, d)),
			"BEGIN:VALARM", "TRIGGER:-P7D", "ACTION:DISPLAY",
			"DESCRIPTION:"+icsEscaper.Replace("7 hari lagi: "+summary), "END:VALARM",
			"BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY",
			"DESCRIPTION:"+icsEscaper.Replace("Besok: "+summary), "END:VALARM",
			"BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY",
			"DESCRIPTION:"+icsEscaper.Replace("Hari ini: "+summary), "END:VALARM",
			"END:VEVENT",
		)
	}
	lines = append(lines, "END:VCALENDAR")

	for i := range lines {
		lines[i] = fold(lines[i])
	}
	return strings.Join(lines, "\r\n") + "\r\n"
}
