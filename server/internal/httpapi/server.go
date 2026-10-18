// Package httpapi exposes the public read API, the token-protected admin API,
// the wallpaper renderer and the HTML pages that need per-event meta tags.
package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"running-calendar/internal/events"
	"running-calendar/internal/tokens"
)

type Config struct {
	// WebRoot is the static site directory; event.html and wallpaper.html are
	// read from it to inject per-event meta tags.
	WebRoot string
	// SiteURL is the public origin used for absolute URLs in meta tags. When
	// empty it is derived from the request.
	SiteURL string
	// ServeStatic makes the server also serve WebRoot, for local development
	// without nginx.
	ServeStatic bool
}

type Server struct {
	cfg        Config
	events     *events.Store
	tokens     *tokens.Store
	limiter    *rateLimiter
	wallpapers *wallpaperCache
}

func New(cfg Config, ev *events.Store, tk *tokens.Store) http.Handler {
	s := &Server{
		cfg:        cfg,
		events:     ev,
		tokens:     tk,
		limiter:    newRateLimiter(10, time.Minute),
		wallpapers: newWallpaperCache(256),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	})
	mux.HandleFunc("GET /api/events", s.listEvents)
	mux.HandleFunc("GET /api/events/{slug}", s.getEvent)
	mux.HandleFunc("GET /api/events/{slug}/calendar.ics", s.eventCalendar)
	mux.HandleFunc("GET /api/wallpaper/{slug}", s.wallpaperImage)

	mux.Handle("GET /api/admin/events", s.requireToken(s.adminListEvents))
	mux.Handle("POST /api/admin/events", s.requireToken(s.adminCreateEvent))
	mux.Handle("POST /api/admin/events/import", s.requireToken(s.adminImportEvents))
	mux.Handle("GET /api/admin/events/{slug}", s.requireToken(s.adminGetEvent))
	mux.Handle("PATCH /api/admin/events/{slug}", s.requireToken(s.adminUpdateEvent))
	mux.Handle("DELETE /api/admin/events/{slug}", s.requireToken(s.adminDeleteEvent))

	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "not_found", nil)
	})

	mux.HandleFunc("GET /events/{slug}", s.eventPage)
	mux.HandleFunc("GET /wallpaper/{slug}", s.wallpaperPage)

	if cfg.ServeStatic {
		mux.Handle("/", s.staticFiles())
	}

	return logRequests(recoverPanics(mux))
}

// staticFiles mimics the nginx config: try the path, then path.html, then 404.html.
func (s *Server) staticFiles() http.Handler {
	files := http.FileServer(http.Dir(s.cfg.WebRoot))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Same as nginx for unfingerprinted assets: always revalidate.
		w.Header().Set("Cache-Control", "no-cache")
		clean := filepath.Clean("/" + r.URL.Path)
		full := filepath.Join(s.cfg.WebRoot, clean)
		if info, err := os.Stat(full); err == nil && (!info.IsDir() || fileExists(filepath.Join(full, "index.html"))) {
			files.ServeHTTP(w, r)
			return
		}
		if fileExists(full + ".html") {
			r2 := r.Clone(r.Context())
			r2.URL.Path = clean + ".html"
			serveFileNoRedirect(w, r2, full+".html")
			return
		}
		s.notFoundPage(w)
	})
}

func serveFileNoRedirect(w http.ResponseWriter, r *http.Request, path string) {
	f, err := os.Open(path)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	info, _ := f.Stat()
	http.ServeContent(w, r, path, info.ModTime(), f)
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func (s *Server) notFoundPage(w http.ResponseWriter) {
	body, err := os.ReadFile(filepath.Join(s.cfg.WebRoot, "404.html"))
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	if err != nil {
		w.Write([]byte("<!doctype html><title>404</title><p>Halaman tidak ditemukan.</p>"))
		return
	}
	w.Write(body)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	enc.Encode(v)
}

func writeError(w http.ResponseWriter, status int, code string, fields events.FieldErrors) {
	body := map[string]any{"error": code}
	if len(fields) > 0 {
		body["fields"] = fields
	}
	writeJSON(w, status, body)
}

// writeStoreError maps store errors to API responses.
func writeStoreError(w http.ResponseWriter, r *http.Request, err error) {
	var fields events.FieldErrors
	var tooLarge *http.MaxBytesError
	switch {
	case errors.As(err, &fields):
		writeError(w, http.StatusBadRequest, "validation_failed", fields)
	case errors.Is(err, events.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", nil)
	case errors.Is(err, events.ErrSlugTaken):
		writeError(w, http.StatusConflict, "slug_taken", nil)
	case errors.As(err, &tooLarge):
		writeError(w, http.StatusRequestEntityTooLarge, "payload_too_large", nil)
	case errors.Is(err, errBadJSON):
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json", "detail": strings.TrimPrefix(err.Error(), errBadJSON.Error()+": ")})
	default:
		log.Printf("error %s %s: %v", r.Method, r.URL.Path, err)
		writeError(w, http.StatusInternalServerError, "internal_error", nil)
	}
}

func clientIP(r *http.Request) string {
	// The API only listens on localhost behind nginx, which sets X-Real-IP.
	if ip := strings.TrimSpace(r.Header.Get("X-Real-IP")); ip != "" {
		return ip
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

type ctxKey int

const tokenNameKey ctxKey = 0

type statusRecorder struct {
	http.ResponseWriter
	status int
	token  string
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r.WithContext(context.WithValue(r.Context(), tokenNameKey, &rec.token)))
		who := ""
		if rec.token != "" {
			who = " token=" + rec.token
		}
		log.Printf("%s %s %d %s ip=%s%s", r.Method, r.URL.Path, rec.status, time.Since(start).Round(time.Millisecond), clientIP(r), who)
	})
}

func recoverPanics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				log.Printf("panic %s %s: %v", r.Method, r.URL.Path, v)
				writeError(w, http.StatusInternalServerError, "internal_error", nil)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
