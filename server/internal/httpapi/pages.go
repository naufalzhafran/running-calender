package httpapi

import (
	"encoding/json"
	"errors"
	"html"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"running-calendar/internal/events"
	"running-calendar/internal/jakarta"
	"running-calendar/internal/wallpaper"
)

// The static pages mark the region Go replaces with per-event tags, and the
// spot where the event JSON is embedded so the page skips one API request.
const (
	metaStart   = "<!--meta:start-->"
	metaEnd     = "<!--meta:end-->"
	dataMarker  = "<!--page-data-->"
	siteName    = "Kalender Lari"
	defaultIcon = "/icons/icon-512.png"
)

type pageMeta struct {
	Title       string
	Description string
	URL         string
	Image       string
	ImageWidth  int
	ImageHeight int
}

func (m pageMeta) render() string {
	esc := html.EscapeString
	var b strings.Builder
	b.WriteString("<title>" + esc(m.Title) + "</title>\n")
	b.WriteString(`<meta name="description" content="` + esc(m.Description) + `">` + "\n")
	b.WriteString(`<link rel="canonical" href="` + esc(m.URL) + `">` + "\n")
	b.WriteString(`<meta property="og:site_name" content="` + siteName + `">` + "\n")
	b.WriteString(`<meta property="og:type" content="website">` + "\n")
	b.WriteString(`<meta property="og:title" content="` + esc(m.Title) + `">` + "\n")
	b.WriteString(`<meta property="og:description" content="` + esc(m.Description) + `">` + "\n")
	b.WriteString(`<meta property="og:url" content="` + esc(m.URL) + `">` + "\n")
	b.WriteString(`<meta property="og:image" content="` + esc(m.Image) + `">` + "\n")
	if m.ImageWidth > 0 {
		b.WriteString(`<meta property="og:image:width" content="` + strconv.Itoa(m.ImageWidth) + `">` + "\n")
		b.WriteString(`<meta property="og:image:height" content="` + strconv.Itoa(m.ImageHeight) + `">` + "\n")
	}
	card := "summary"
	if m.ImageWidth > 0 {
		card = "summary_large_image"
	}
	b.WriteString(`<meta name="twitter:card" content="` + card + `">` + "\n")
	b.WriteString(`<meta name="twitter:title" content="` + esc(m.Title) + `">` + "\n")
	b.WriteString(`<meta name="twitter:description" content="` + esc(m.Description) + `">` + "\n")
	b.WriteString(`<meta name="twitter:image" content="` + esc(m.Image) + `">`)
	return b.String()
}

func (s *Server) siteURL(r *http.Request) string {
	if s.cfg.SiteURL != "" {
		return strings.TrimRight(s.cfg.SiteURL, "/")
	}
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	return scheme + "://" + r.Host
}

// renderPage reads file from the web root, swaps in meta and embeds data.
func (s *Server) renderPage(w http.ResponseWriter, file string, meta pageMeta, data any) {
	raw, err := os.ReadFile(filepath.Join(s.cfg.WebRoot, file))
	if err != nil {
		http.Error(w, "page template missing: "+file, http.StatusInternalServerError)
		return
	}
	page := string(raw)
	if start, end := strings.Index(page, metaStart), strings.Index(page, metaEnd); start >= 0 && end > start {
		page = page[:start] + meta.render() + page[end+len(metaEnd):]
	}
	// json.Marshal escapes <, > and &, so the payload cannot close the script tag.
	payload, _ := json.Marshal(data)
	page = strings.Replace(page, dataMarker,
		`<script type="application/json" id="page-data">`+string(payload)+`</script>`, 1)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=60")
	w.Write([]byte(page))
}

func (s *Server) loadPageEvent(w http.ResponseWriter, r *http.Request) (events.Event, bool) {
	ev, err := s.events.Get(r.Context(), r.PathValue("slug"))
	if errors.Is(err, events.ErrNotFound) {
		s.notFoundPage(w)
		return ev, false
	}
	if err != nil {
		writeStoreError(w, r, err)
		return ev, false
	}
	return ev, true
}

func distanceNames(ev events.Event) string {
	names := make([]string, len(ev.Distances))
	for i, d := range ev.Distances {
		names[i] = d.Name
	}
	return strings.Join(names, ", ")
}

func (s *Server) eventPage(w http.ResponseWriter, r *http.Request) {
	ev, ok := s.loadPageEvent(w, r)
	if !ok {
		return
	}
	site := s.siteURL(r)
	desc := jakarta.LongDate(ev.EventDate) + " · " + ev.Location
	if names := distanceNames(ev); names != "" {
		desc += " · " + names
	}
	s.renderPage(w, "event.html", pageMeta{
		Title:       ev.Title + " | " + siteName,
		Description: desc,
		URL:         site + "/events/" + url.PathEscape(ev.Slug),
		Image:       site + defaultIcon,
	}, ev)
}

func countdownCopy(daysLeft int) string {
	switch {
	case daysLeft < 0:
		return strconv.Itoa(-daysLeft) + " hari sejak event"
	case daysLeft == 0:
		return "Hari ini event dimulai"
	case daysLeft == 1:
		return "1 hari lagi menuju event"
	default:
		return strconv.Itoa(daysLeft) + " hari lagi menuju event"
	}
}

func (s *Server) wallpaperPage(w http.ResponseWriter, r *http.Request) {
	ev, ok := s.loadPageEvent(w, r)
	if !ok {
		return
	}
	site := s.siteURL(r)
	q := r.URL.Query()
	preset := wallpaper.GetPreset(q.Get("preset"))
	distance := ev.PickDistance(q.Get("distance"))

	params := url.Values{}
	targetDate := ev.EventDate
	label, forDistance := "", ""
	if distance != nil {
		params.Set("distance", distance.Name)
		targetDate = distance.Date
		label = " • " + distance.Name
		forDistance = " kategori " + distance.Name
	}
	params.Set("preset", preset.Key)
	slug := url.PathEscape(ev.Slug)

	title := "Detail kategori" + label + " • " + ev.Title
	s.renderPage(w, "wallpaper.html", pageMeta{
		Title: title,
		Description: countdownCopy(jakarta.DaysUntil(targetDate)) + " untuk " + ev.Title + forDistance +
			". Tanggal event " + jakarta.MediumDate(targetDate) + ".",
		URL:         site + "/wallpaper/" + slug + "?" + params.Encode(),
		Image:       site + "/api/wallpaper/" + slug + "?" + params.Encode(),
		ImageWidth:  preset.Width,
		ImageHeight: preset.Height,
	}, ev)
}
