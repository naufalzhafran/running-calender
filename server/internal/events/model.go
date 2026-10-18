// Package events holds the event model, input validation and SQLite storage.
package events

import (
	"errors"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

var (
	ErrNotFound  = errors.New("event not found")
	ErrSlugTaken = errors.New("slug already in use")
)

type Distance struct {
	Name         string        `json:"name"`
	Date         string        `json:"date"`
	StartTime    *string       `json:"start_time"`
	COT          *string       `json:"cot"`
	RouteURL     *string       `json:"route_url"`
	CutOffPoints []CutOffPoint `json:"cut_off_points"`
	// RoutePolyline is the course as a Google encoded polyline. It is left out
	// of list responses to keep them small.
	RoutePolyline *string `json:"route_polyline,omitempty"`
}

// CutOffPoint is a checkpoint on the course that closes at a time of day (COT).
type CutOffPoint struct {
	Name string  `json:"name"`
	KM   float64 `json:"km"`
	COT  string  `json:"cot"`
}

type Event struct {
	ID          int64      `json:"-"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	EventDate   string     `json:"event_date"`
	EndDate     *string    `json:"end_date"`
	Location    string     `json:"location"`
	Description *string    `json:"description,omitempty"`
	Distances   []Distance `json:"distances"`
	CreatedAt   string     `json:"created_at"`
	UpdatedAt   string     `json:"updated_at"`
}

// LastDate is the final day of the event (end_date, or event_date for one-day events).
func (e Event) LastDate() string {
	if e.EndDate != nil {
		return *e.EndDate
	}
	return e.EventDate
}

// PickDistance returns the distance matching name (case-insensitive), or the
// earliest-dated distance, or nil when the event has none.
func (e Event) PickDistance(name string) *Distance {
	want := NormalizeName(name)
	if want != "" {
		for i := range e.Distances {
			if NormalizeName(e.Distances[i].Name) == want {
				return &e.Distances[i]
			}
		}
	}
	var best *Distance
	for i := range e.Distances {
		if best == nil || e.Distances[i].Date < best.Date {
			best = &e.Distances[i]
		}
	}
	return best
}

// DistanceInput is one distance as accepted by the write API. Empty strings and
// nulls are treated the same; a missing date defaults to the event date.
type DistanceInput struct {
	Name          string             `json:"name"`
	Date          string             `json:"date"`
	StartTime     string             `json:"start_time"`
	COT           string             `json:"cot"`
	RouteURL      string             `json:"route_url"`
	CutOffPoints  []CutOffPointInput `json:"cut_off_points"`
	RoutePolyline string             `json:"route_polyline"`
}

// CutOffPointInput is one cut-off point as accepted by the write API.
type CutOffPointInput struct {
	Name string  `json:"name"`
	KM   float64 `json:"km"`
	COT  string  `json:"cot"`
}

// Input is the create/import payload. "distance" is accepted as an alias of
// "distances" so files written for the previous PocketBase CLI keep working.
type Input struct {
	Title       string          `json:"title"`
	Slug        string          `json:"slug"`
	EventDate   string          `json:"event_date"`
	EndDate     *string         `json:"end_date"`
	Location    string          `json:"location"`
	Description *string         `json:"description"`
	Distances   []DistanceInput `json:"distances"`
	Distance    []DistanceInput `json:"distance"`
}

// InputFromEvent converts a stored event back into an Input, used as the base
// that PATCH payloads are decoded on top of.
func InputFromEvent(e Event) Input {
	in := Input{
		Title:       e.Title,
		Slug:        e.Slug,
		EventDate:   e.EventDate,
		EndDate:     e.EndDate,
		Location:    e.Location,
		Description: e.Description,
		Distances:   make([]DistanceInput, 0, len(e.Distances)),
	}
	for _, d := range e.Distances {
		points := make([]CutOffPointInput, len(d.CutOffPoints))
		for i, p := range d.CutOffPoints {
			points[i] = CutOffPointInput(p)
		}
		in.Distances = append(in.Distances, DistanceInput{
			Name:          d.Name,
			Date:          d.Date,
			StartTime:     deref(d.StartTime),
			COT:           deref(d.COT),
			RouteURL:      deref(d.RouteURL),
			CutOffPoints:  points,
			RoutePolyline: deref(d.RoutePolyline),
		})
	}
	return in
}

// FieldErrors maps a JSON field path (e.g. "distances[1].cot") to a message.
type FieldErrors map[string]string

func (f FieldErrors) Error() string { return "validation failed" }

var (
	slugPattern     = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	slugReplacer    = regexp.MustCompile(`[^a-z0-9]+`)
	timePattern     = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)
	maxDistances    = 20
	maxDescription  = 10000
	maxTextField    = 200
	maxDistanceName = 100
	maxRouteURL     = 500
	maxCutOffPoints = 20
	maxCutOffKM     = 1000.0
	maxPolyline     = 20000
)

// CreateSlug lowercases value and joins runs of other characters with "-".
func CreateSlug(value string) string {
	s := slugReplacer.ReplaceAllString(strings.ToLower(strings.TrimSpace(value)), "-")
	return strings.Trim(s, "-")
}

func NormalizeName(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func validDate(value string) bool {
	_, err := time.Parse(time.DateOnly, value)
	return err == nil
}

// Normalize trims and validates in, filling defaults (slug from title,
// distance dates from event_date) and converting empty strings to nil.
func Normalize(in Input) (Event, error) {
	errs := FieldErrors{}
	ev := Event{
		Title:     strings.TrimSpace(in.Title),
		Slug:      strings.TrimSpace(in.Slug),
		EventDate: strings.TrimSpace(in.EventDate),
		Location:  strings.TrimSpace(in.Location),
	}

	if n := utf8.RuneCountInString(ev.Title); n == 0 {
		errs["title"] = "is required"
	} else if n > maxTextField {
		errs["title"] = "must be at most 200 characters"
	}

	if ev.Slug == "" {
		ev.Slug = CreateSlug(ev.Title)
	}
	if len(ev.Slug) > maxTextField {
		errs["slug"] = "must be at most 200 characters"
	} else if !slugPattern.MatchString(ev.Slug) {
		errs["slug"] = "must be lowercase letters, digits and single dashes"
	}

	if !validDate(ev.EventDate) {
		errs["event_date"] = "must be YYYY-MM-DD"
	}

	if in.EndDate != nil {
		if end := strings.TrimSpace(*in.EndDate); end != "" {
			switch {
			case !validDate(end):
				errs["end_date"] = "must be YYYY-MM-DD"
			case end < ev.EventDate:
				errs["end_date"] = "must be on or after event_date"
			default:
				ev.EndDate = &end
			}
		}
	}

	if n := utf8.RuneCountInString(ev.Location); n == 0 {
		errs["location"] = "is required"
	} else if n > maxTextField {
		errs["location"] = "must be at most 200 characters"
	}

	if in.Description != nil {
		if desc := strings.TrimSpace(*in.Description); desc != "" {
			if utf8.RuneCountInString(desc) > maxDescription {
				errs["description"] = "must be at most 10000 characters"
			} else {
				ev.Description = &desc
			}
		}
	}

	distances := in.Distances
	field := "distances"
	if in.Distance != nil {
		if in.Distances != nil {
			errs["distance"] = `use either "distances" or "distance", not both`
		}
		distances, field = in.Distance, "distance"
	}
	if len(distances) > maxDistances {
		errs[field] = "must have at most 20 entries"
	}

	ev.Distances = make([]Distance, 0, len(distances))
	seen := map[string]bool{}
	for i, d := range distances {
		prefix := field + "[" + strconv.Itoa(i) + "]."
		name := strings.TrimSpace(d.Name)
		if n := utf8.RuneCountInString(name); n == 0 {
			errs[prefix+"name"] = "is required"
		} else if n > maxDistanceName {
			errs[prefix+"name"] = "must be at most 100 characters"
		} else if seen[NormalizeName(name)] {
			errs[prefix+"name"] = "duplicates another distance"
		}
		seen[NormalizeName(name)] = true

		date := strings.TrimSpace(d.Date)
		if date == "" {
			date = ev.EventDate
		} else if !validDate(date) {
			errs[prefix+"date"] = "must be YYYY-MM-DD"
		}

		dist := Distance{Name: name, Date: date}
		if t := strings.TrimSpace(d.StartTime); t != "" {
			if !timePattern.MatchString(t) {
				errs[prefix+"start_time"] = "must be HH:MM"
			}
			dist.StartTime = &t
		}
		if t := strings.TrimSpace(d.COT); t != "" {
			if !timePattern.MatchString(t) {
				errs[prefix+"cot"] = "must be HH:MM"
			}
			dist.COT = &t
		}
		if u := strings.TrimSpace(d.RouteURL); u != "" {
			if len(u) > maxRouteURL {
				errs[prefix+"route_url"] = "must be at most 500 characters"
			} else if !validURL(u) {
				errs[prefix+"route_url"] = "must be an http or https URL"
			}
			dist.RouteURL = &u
		}
		if p := strings.TrimSpace(d.RoutePolyline); p != "" {
			if len(p) > maxPolyline {
				errs[prefix+"route_polyline"] = "must be at most 20000 characters (simplify the course first)"
			} else if !validPolyline(p) {
				errs[prefix+"route_polyline"] = "must be a Google encoded polyline (precision 5) with at least 2 points"
			}
			dist.RoutePolyline = &p
		}
		if len(d.CutOffPoints) > maxCutOffPoints {
			errs[prefix+"cut_off_points"] = "must have at most 20 entries"
		}
		dist.CutOffPoints = make([]CutOffPoint, 0, len(d.CutOffPoints))
		for j, p := range d.CutOffPoints {
			pp := prefix + "cut_off_points[" + strconv.Itoa(j) + "]."
			point := CutOffPoint{Name: strings.TrimSpace(p.Name), KM: p.KM, COT: strings.TrimSpace(p.COT)}
			if n := utf8.RuneCountInString(point.Name); n == 0 {
				errs[pp+"name"] = "is required"
			} else if n > maxDistanceName {
				errs[pp+"name"] = "must be at most 100 characters"
			}
			if point.KM <= 0 || point.KM > maxCutOffKM {
				errs[pp+"km"] = "must be greater than 0 and at most 1000"
			}
			if !timePattern.MatchString(point.COT) {
				errs[pp+"cot"] = "must be HH:MM"
			}
			dist.CutOffPoints = append(dist.CutOffPoints, point)
		}
		ev.Distances = append(ev.Distances, dist)
	}

	if len(errs) > 0 {
		return Event{}, errs
	}
	return ev, nil
}

// validPolyline decodes a Google encoded polyline (precision 5) and checks it
// has at least two points, all with valid coordinates.
func validPolyline(value string) bool {
	var lat, lng, points int
	for i := 0; i < len(value); {
		var delta [2]int
		for k := range delta {
			shift, result := 0, 0
			for {
				if i >= len(value) || shift > 30 {
					return false
				}
				b := int(value[i]) - 63
				i++
				if b < 0 || b > 63 {
					return false
				}
				result |= (b & 0x1f) << shift
				shift += 5
				if b < 0x20 {
					break
				}
			}
			if result&1 != 0 {
				delta[k] = ^(result >> 1)
			} else {
				delta[k] = result >> 1
			}
		}
		lat += delta[0]
		lng += delta[1]
		if lat < -9000000 || lat > 9000000 || lng < -18000000 || lng > 18000000 {
			return false
		}
		points++
	}
	return points >= 2
}

func validURL(value string) bool {
	u, err := url.Parse(value)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
