package httpapi

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strconv"
	"sync"
	"time"

	"running-calendar/internal/calendar"
	"running-calendar/internal/events"
	"running-calendar/internal/jakarta"
	"running-calendar/internal/wallpaper"
)

const (
	defaultListLimit = 500
	maxListLimit     = 1000
)

func parseListFilter(r *http.Request, defaultWhen events.When) (events.ListFilter, bool) {
	q := r.URL.Query()
	f := events.ListFilter{
		When:  defaultWhen,
		Today: jakarta.Today(),
		Query: q.Get("q"),
		Limit: defaultListLimit,
	}
	if v := q.Get("when"); v != "" {
		switch events.When(v) {
		case events.Upcoming, events.Past, events.All:
			f.When = events.When(v)
		default:
			return f, false
		}
	}
	if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return f, false
		}
		f.Limit = min(n, maxListLimit)
	}
	if v := q.Get("offset"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			return f, false
		}
		f.Offset = n
	}
	return f, true
}

type listResponse struct {
	Items []events.Event `json:"items"`
	Total int            `json:"total"`
	Today string         `json:"today"`
}

func (s *Server) listEvents(w http.ResponseWriter, r *http.Request) {
	f, ok := parseListFilter(r, events.Upcoming)
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid_query", nil)
		return
	}
	items, total, err := s.events.List(r.Context(), f)
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60")
	writeJSON(w, http.StatusOK, listResponse{Items: items, Total: total, Today: f.Today})
}

func (s *Server) getEvent(w http.ResponseWriter, r *http.Request) {
	ev, err := s.events.Get(r.Context(), r.PathValue("slug"))
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "public, max-age=60")
	writeJSON(w, http.StatusOK, ev)
}

func (s *Server) eventCalendar(w http.ResponseWriter, r *http.Request) {
	ev, err := s.events.Get(r.Context(), r.PathValue("slug"))
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "text/calendar; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="`+ev.Slug+`.ics"`)
	w.Header().Set("Cache-Control", "public, max-age=300")
	w.Write([]byte(calendar.Build(ev, r.URL.Query().Get("distance"))))
}

// wallpaperImage renders the countdown PNG. Renders are cached per event
// version, day, distance and size; iOS Shortcuts fetch this URL daily.
func (s *Server) wallpaperImage(w http.ResponseWriter, r *http.Request) {
	ev, err := s.events.Get(r.Context(), r.PathValue("slug"))
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	q := r.URL.Query()
	preset := wallpaper.GetPreset(q.Get("preset"))
	width, height := preset.Width, preset.Height
	if q.Get("preview") == "1" && width > wallpaper.PreviewMaxWidth {
		height = height * wallpaper.PreviewMaxWidth / width
		width = wallpaper.PreviewMaxWidth
	}
	distance := ev.PickDistance(q.Get("distance"))
	distanceName := ""
	if distance != nil {
		distanceName = distance.Name
	}

	key := ev.Slug + "|" + ev.UpdatedAt + "|" + jakarta.Today() + "|" + distanceName + "|" +
		strconv.Itoa(width) + "x" + strconv.Itoa(height)
	entry, ok := s.wallpapers.get(key)
	if !ok {
		png, err := wallpaper.Render(wallpaper.NewModel(ev, distance, time.Now()), width, height)
		if err != nil {
			writeStoreError(w, r, err)
			return
		}
		sum := sha256.Sum256(png)
		entry = wallpaperEntry{png: png, etag: `"` + hex.EncodeToString(sum[:8]) + `"`, expires: time.Now().Add(15 * time.Minute)}
		s.wallpapers.put(key, entry)
	}

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=0, s-maxage=900, stale-while-revalidate=86400")
	w.Header().Set("ETag", entry.etag)
	if r.Header.Get("If-None-Match") == entry.etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	w.Write(entry.png)
}

type wallpaperEntry struct {
	png     []byte
	etag    string
	expires time.Time
}

type wallpaperCache struct {
	mu      sync.Mutex
	max     int
	entries map[string]wallpaperEntry
}

func newWallpaperCache(max int) *wallpaperCache {
	return &wallpaperCache{max: max, entries: map[string]wallpaperEntry{}}
}

func (c *wallpaperCache) get(key string) (wallpaperEntry, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.entries[key]
	if !ok || time.Now().After(e.expires) {
		return wallpaperEntry{}, false
	}
	return e, true
}

func (c *wallpaperCache) put(key string, e wallpaperEntry) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.entries) >= c.max {
		now := time.Now()
		for k, v := range c.entries {
			if now.After(v.expires) {
				delete(c.entries, k)
			}
		}
		// Still full: drop everything rather than track recency.
		if len(c.entries) >= c.max {
			c.entries = map[string]wallpaperEntry{}
		}
	}
	c.entries[key] = e
}
