// Package jakarta holds date helpers pinned to Asia/Jakarta, the timezone all
// event dates and times are expressed in.
package jakarta

import (
	"fmt"
	"time"
	_ "time/tzdata" // distroless images ship without zoneinfo
)

var Location = mustLoad()

func mustLoad() *time.Location {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.FixedZone("WIB", 7*60*60)
	}
	return loc
}

var months = [...]string{"Januari", "Februari", "Maret", "April", "Mei", "Juni",
	"Juli", "Agustus", "September", "Oktober", "November", "Desember"}

var weekdays = [...]string{"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}

// Today returns the current date in Jakarta as YYYY-MM-DD.
func Today() string {
	return time.Now().In(Location).Format(time.DateOnly)
}

// ParseDate parses YYYY-MM-DD as midnight in Jakarta.
func ParseDate(value string) (time.Time, error) {
	return time.ParseInLocation(time.DateOnly, value, Location)
}

// DaysUntil returns whole calendar days from today (Jakarta) to date.
func DaysUntil(date string) int {
	target, err := ParseDate(date)
	if err != nil {
		return 0
	}
	today, _ := ParseDate(Today())
	return int(target.Sub(today).Hours() / 24)
}

// LongDate formats a date like "Minggu, 16 Mei 2027".
func LongDate(date string) string {
	t, err := ParseDate(date)
	if err != nil {
		return date
	}
	return fmt.Sprintf("%s, %d %s %d", weekdays[t.Weekday()], t.Day(), months[t.Month()-1], t.Year())
}

// MediumDate formats a date like "16 Mei 2027".
func MediumDate(date string) string {
	t, err := ParseDate(date)
	if err != nil {
		return date
	}
	return fmt.Sprintf("%d %s %d", t.Day(), months[t.Month()-1], t.Year())
}
