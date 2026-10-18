package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"running-calendar/internal/events"
)

const maxBodyBytes = 1 << 20

var errBadJSON = errors.New("invalid json")

// requireToken checks the bearer token and rate-limits failed attempts per IP.
func (s *Server) requireToken(next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		ip := clientIP(r)
		if s.limiter.blocked(ip) {
			w.Header().Set("Retry-After", "60")
			writeError(w, http.StatusTooManyRequests, "too_many_requests", nil)
			return
		}
		token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
		name, valid := "", false
		if ok {
			name, valid = s.tokens.Verify(r.Context(), strings.TrimSpace(token))
		}
		if !valid {
			s.limiter.fail(ip)
			writeError(w, http.StatusUnauthorized, "unauthorized", nil)
			return
		}
		if p, ok := r.Context().Value(tokenNameKey).(*string); ok {
			*p = name
		}
		next(w, r)
	})
}

// readBody reads at most maxBodyBytes and requires a JSON content type.
func readBody(w http.ResponseWriter, r *http.Request) ([]byte, error) {
	if ct := r.Header.Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
		return nil, fmt.Errorf("%w: Content-Type must be application/json", errBadJSON)
	}
	return io.ReadAll(http.MaxBytesReader(w, r.Body, maxBodyBytes))
}

// decodeStrict decodes body into v, rejecting unknown fields and trailing data.
func decodeStrict(body []byte, v any) error {
	dec := json.NewDecoder(bytes.NewReader(body))
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		return fmt.Errorf("%w: %v", errBadJSON, err)
	}
	if dec.More() {
		return fmt.Errorf("%w: unexpected data after JSON value", errBadJSON)
	}
	return nil
}

func (s *Server) adminListEvents(w http.ResponseWriter, r *http.Request) {
	f, ok := parseListFilter(r, events.All)
	if !ok {
		writeError(w, http.StatusBadRequest, "invalid_query", nil)
		return
	}
	f.IncludeDescription = true
	items, total, err := s.events.List(r.Context(), f)
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, listResponse{Items: items, Total: total, Today: f.Today})
}

func (s *Server) adminGetEvent(w http.ResponseWriter, r *http.Request) {
	ev, err := s.events.Get(r.Context(), r.PathValue("slug"))
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ev)
}

func (s *Server) adminCreateEvent(w http.ResponseWriter, r *http.Request) {
	body, err := readBody(w, r)
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	var in events.Input
	if err := decodeStrict(body, &in); err != nil {
		writeStoreError(w, r, err)
		return
	}
	ev, err := s.events.Create(r.Context(), in)
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, ev)
}

// adminUpdateEvent applies a partial update. Only fields present in the body
// change; "distances" (or "distance") replaces the whole list when present.
func (s *Server) adminUpdateEvent(w http.ResponseWriter, r *http.Request) {
	body, err := readBody(w, r)
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	var keys map[string]json.RawMessage
	if err := json.Unmarshal(body, &keys); err != nil {
		writeStoreError(w, r, fmt.Errorf("%w: %v", errBadJSON, err))
		return
	}
	ev, err := s.events.Update(r.Context(), r.PathValue("slug"), func(in *events.Input) error {
		if _, ok := keys["distance"]; ok {
			in.Distances = nil
		}
		return decodeStrict(body, in)
	})
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, ev)
}

func (s *Server) adminDeleteEvent(w http.ResponseWriter, r *http.Request) {
	if err := s.events.Delete(r.Context(), r.PathValue("slug")); err != nil {
		writeStoreError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// adminImportEvents accepts either a JSON array of events or {"events": [...]}.
func (s *Server) adminImportEvents(w http.ResponseWriter, r *http.Request) {
	body, err := readBody(w, r)
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	var inputs []events.Input
	if trimmed := bytes.TrimSpace(body); len(trimmed) > 0 && trimmed[0] == '{' {
		var wrapper struct {
			Events []events.Input `json:"events"`
		}
		err = decodeStrict(body, &wrapper)
		inputs = wrapper.Events
	} else {
		err = decodeStrict(body, &inputs)
	}
	if err != nil {
		writeStoreError(w, r, err)
		return
	}

	q := r.URL.Query()
	result, err := s.events.Import(r.Context(), inputs, events.ImportOptions{
		DryRun:     isTrue(q.Get("dry_run")),
		CreateOnly: isTrue(q.Get("create_only")),
	})
	if err != nil {
		writeStoreError(w, r, err)
		return
	}
	status := http.StatusOK
	if len(result.Errors) > 0 {
		status = http.StatusBadRequest
	}
	writeJSON(w, status, result)
}

func isTrue(v string) bool {
	return v == "1" || v == "true"
}

// rateLimiter blocks an IP after max failed attempts within window.
type rateLimiter struct {
	mu       sync.Mutex
	max      int
	window   time.Duration
	failures map[string]*failureWindow
}

type failureWindow struct {
	start time.Time
	count int
}

func newRateLimiter(max int, window time.Duration) *rateLimiter {
	return &rateLimiter{max: max, window: window, failures: map[string]*failureWindow{}}
}

func (l *rateLimiter) blocked(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	f := l.failures[ip]
	if f == nil {
		return false
	}
	if time.Since(f.start) > l.window {
		delete(l.failures, ip)
		return false
	}
	return f.count >= l.max
}

func (l *rateLimiter) fail(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	for k, f := range l.failures {
		if now.Sub(f.start) > l.window {
			delete(l.failures, k)
		}
	}
	f := l.failures[ip]
	if f == nil {
		f = &failureWindow{start: now}
		l.failures[ip] = f
	}
	f.count++
}
