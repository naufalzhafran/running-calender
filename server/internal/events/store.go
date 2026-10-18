package events

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// When selects events relative to today: upcoming events have not finished
// yet (last day >= today), past events have.
type When string

const (
	Upcoming When = "upcoming"
	Past     When = "past"
	All      When = "all"
)

type ListFilter struct {
	When               When
	Today              string // YYYY-MM-DD in Jakarta
	Query              string // space-separated terms matched against title and location
	Limit              int
	Offset             int
	IncludeDescription bool
}

const eventColumns = `id, slug, title, event_date, end_date, location, created_at, updated_at`

func (s *Store) List(ctx context.Context, f ListFilter) ([]Event, int, error) {
	var where []string
	var args []any

	switch f.When {
	case Upcoming:
		where = append(where, "last_date >= ?")
		args = append(args, f.Today)
	case Past:
		where = append(where, "last_date < ?")
		args = append(args, f.Today)
	}
	for _, term := range strings.Fields(strings.ToLower(f.Query)) {
		where = append(where, "(lower(title) LIKE ? ESCAPE '\\' OR lower(location) LIKE ? ESCAPE '\\')")
		like := "%" + escapeLike(term) + "%"
		args = append(args, like, like)
	}

	whereSQL := ""
	if len(where) > 0 {
		whereSQL = " WHERE " + strings.Join(where, " AND ")
	}

	var total int
	if err := s.db.QueryRowContext(ctx, "SELECT count(*) FROM events"+whereSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	order := " ORDER BY event_date ASC, id ASC"
	if f.When == Past {
		order = " ORDER BY event_date DESC, id DESC"
	}
	columns := eventColumns
	if f.IncludeDescription {
		columns += ", description"
	}
	query := "SELECT " + columns + " FROM events" + whereSQL + order + " LIMIT ? OFFSET ?"
	rows, err := s.db.QueryContext(ctx, query, append(args, f.Limit, f.Offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	list := []Event{}
	for rows.Next() {
		ev, err := scanEvent(rows, f.IncludeDescription)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, ev)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if err := attachDistances(ctx, s.db, list, f.IncludeDescription); err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (s *Store) Get(ctx context.Context, slug string) (Event, error) {
	return getBySlug(ctx, s.db, slug)
}

func (s *Store) Create(ctx context.Context, in Input) (Event, error) {
	ev, err := Normalize(in)
	if err != nil {
		return Event{}, err
	}
	err = s.inTx(ctx, func(tx *sql.Tx) error {
		if _, err := getBySlug(ctx, tx, ev.Slug); err == nil {
			return ErrSlugTaken
		} else if !errors.Is(err, ErrNotFound) {
			return err
		}
		return insertEvent(ctx, tx, ev)
	})
	if err != nil {
		return Event{}, err
	}
	return s.Get(ctx, ev.Slug)
}

// Update applies patch to the event identified by slug. apply decodes the
// patch on top of the current values; returning an error aborts the update.
func (s *Store) Update(ctx context.Context, slug string, apply func(*Input) error) (Event, error) {
	var newSlug string
	err := s.inTx(ctx, func(tx *sql.Tx) error {
		current, err := getBySlug(ctx, tx, slug)
		if err != nil {
			return err
		}
		in := InputFromEvent(current)
		if err := apply(&in); err != nil {
			return err
		}
		ev, err := Normalize(in)
		if err != nil {
			return err
		}
		if ev.Slug != current.Slug {
			if _, err := getBySlug(ctx, tx, ev.Slug); err == nil {
				return ErrSlugTaken
			} else if !errors.Is(err, ErrNotFound) {
				return err
			}
		}
		ev.ID = current.ID
		newSlug = ev.Slug
		return updateEvent(ctx, tx, ev)
	})
	if err != nil {
		return Event{}, err
	}
	return s.Get(ctx, newSlug)
}

func (s *Store) Delete(ctx context.Context, slug string) error {
	res, err := s.db.ExecContext(ctx, "DELETE FROM events WHERE slug = ?", slug)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

type ImportOptions struct {
	DryRun     bool
	CreateOnly bool
}

type ImportError struct {
	Index  int         `json:"index"`
	Slug   string      `json:"slug,omitempty"`
	Error  string      `json:"error"`
	Fields FieldErrors `json:"fields,omitempty"`
}

// ImportResult lists what the import did, or would do when Applied is false
// (a dry run, or a file with invalid entries).
type ImportResult struct {
	DryRun  bool          `json:"dry_run"`
	Applied bool          `json:"applied"`
	Created []string      `json:"created"`
	Updated []string      `json:"updated"`
	Skipped []string      `json:"skipped"`
	Errors  []ImportError `json:"errors"`
}

var errRollback = errors.New("rollback")

// Import upserts inputs by slug in a single transaction. If any input is
// invalid nothing is written; with DryRun the transaction is always rolled back.
func (s *Store) Import(ctx context.Context, inputs []Input, opts ImportOptions) (ImportResult, error) {
	result := ImportResult{DryRun: opts.DryRun, Created: []string{}, Updated: []string{}, Skipped: []string{}, Errors: []ImportError{}}
	seen := map[string]int{}

	err := s.inTx(ctx, func(tx *sql.Tx) error {
		for i, in := range inputs {
			ev, err := Normalize(in)
			if err != nil {
				var fe FieldErrors
				errors.As(err, &fe)
				result.Errors = append(result.Errors, ImportError{Index: i, Slug: strings.TrimSpace(in.Slug), Error: "validation_failed", Fields: fe})
				continue
			}
			if prev, dup := seen[ev.Slug]; dup {
				result.Errors = append(result.Errors, ImportError{Index: i, Slug: ev.Slug, Error: "duplicate slug in file (also at index " + strconv.Itoa(prev) + ")"})
				continue
			}
			seen[ev.Slug] = i

			current, err := getBySlug(ctx, tx, ev.Slug)
			switch {
			case errors.Is(err, ErrNotFound):
				if err := insertEvent(ctx, tx, ev); err != nil {
					return err
				}
				result.Created = append(result.Created, ev.Slug)
			case err != nil:
				return err
			case opts.CreateOnly:
				result.Skipped = append(result.Skipped, ev.Slug)
			default:
				ev.ID = current.ID
				if err := updateEvent(ctx, tx, ev); err != nil {
					return err
				}
				result.Updated = append(result.Updated, ev.Slug)
			}
		}
		if opts.DryRun || len(result.Errors) > 0 {
			return errRollback
		}
		return nil
	})
	if err != nil && !errors.Is(err, errRollback) {
		return ImportResult{}, err
	}
	result.Applied = err == nil
	return result, nil
}

type queryer interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

func (s *Store) inTx(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

type scanner interface {
	Scan(dest ...any) error
}

func scanEvent(row scanner, withDescription bool) (Event, error) {
	var ev Event
	var endDate, description sql.NullString
	dest := []any{&ev.ID, &ev.Slug, &ev.Title, &ev.EventDate, &endDate, &ev.Location, &ev.CreatedAt, &ev.UpdatedAt}
	if withDescription {
		dest = append(dest, &description)
	}
	if err := row.Scan(dest...); err != nil {
		return Event{}, err
	}
	ev.EndDate = nullable(endDate)
	ev.Description = nullable(description)
	return ev, nil
}

func getBySlug(ctx context.Context, q queryer, slug string) (Event, error) {
	row := q.QueryRowContext(ctx, "SELECT "+eventColumns+", description FROM events WHERE slug = ?", slug)
	ev, err := scanEvent(row, true)
	if errors.Is(err, sql.ErrNoRows) {
		return Event{}, ErrNotFound
	}
	if err != nil {
		return Event{}, err
	}
	list := []Event{ev}
	if err := attachDistances(ctx, q, list, true); err != nil {
		return Event{}, err
	}
	return list[0], nil
}

// attachDistances loads each event's distances. withPolyline also loads the
// course geometry, which only detail and admin responses need.
func attachDistances(ctx context.Context, q queryer, list []Event, withPolyline bool) error {
	if len(list) == 0 {
		return nil
	}
	index := make(map[int64]int, len(list))
	args := make([]any, len(list))
	for i := range list {
		index[list[i].ID] = i
		args[i] = list[i].ID
		list[i].Distances = []Distance{}
	}
	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(list)), ",")
	rows, err := q.QueryContext(ctx,
		"SELECT event_id, name, race_date, start_time, cot, route_url, cut_off_points, "+polylineColumn(withPolyline)+" FROM event_distances WHERE event_id IN ("+placeholders+") ORDER BY event_id, position",
		args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var eventID int64
		var d Distance
		var start, cot, routeURL, points, polyline sql.NullString
		if err := rows.Scan(&eventID, &d.Name, &d.Date, &start, &cot, &routeURL, &points, &polyline); err != nil {
			return err
		}
		d.StartTime, d.COT, d.RouteURL = nullable(start), nullable(cot), nullable(routeURL)
		d.RoutePolyline = nullable(polyline)
		d.CutOffPoints = []CutOffPoint{}
		if points.Valid {
			if err := json.Unmarshal([]byte(points.String), &d.CutOffPoints); err != nil {
				return err
			}
		}
		i := index[eventID]
		list[i].Distances = append(list[i].Distances, d)
	}
	return rows.Err()
}

func polylineColumn(include bool) string {
	if include {
		return "route_polyline"
	}
	return "NULL"
}

func insertEvent(ctx context.Context, tx *sql.Tx, ev Event) error {
	res, err := tx.ExecContext(ctx,
		`INSERT INTO events (slug, title, event_date, end_date, location, description) VALUES (?, ?, ?, ?, ?, ?)`,
		ev.Slug, ev.Title, ev.EventDate, ev.EndDate, ev.Location, ev.Description)
	if err != nil {
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	return insertDistances(ctx, tx, id, ev.Distances)
}

func updateEvent(ctx context.Context, tx *sql.Tx, ev Event) error {
	_, err := tx.ExecContext(ctx,
		`UPDATE events SET slug = ?, title = ?, event_date = ?, end_date = ?, location = ?, description = ?,
		 updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`,
		ev.Slug, ev.Title, ev.EventDate, ev.EndDate, ev.Location, ev.Description, ev.ID)
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM event_distances WHERE event_id = ?", ev.ID); err != nil {
		return err
	}
	return insertDistances(ctx, tx, ev.ID, ev.Distances)
}

func insertDistances(ctx context.Context, tx *sql.Tx, eventID int64, distances []Distance) error {
	for i, d := range distances {
		var points *string
		if len(d.CutOffPoints) > 0 {
			b, err := json.Marshal(d.CutOffPoints)
			if err != nil {
				return err
			}
			s := string(b)
			points = &s
		}
		if _, err := tx.ExecContext(ctx,
			`INSERT INTO event_distances (event_id, position, name, race_date, start_time, cot, route_url, cut_off_points, route_polyline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			eventID, i, d.Name, d.Date, d.StartTime, d.COT, d.RouteURL, points, d.RoutePolyline); err != nil {
			return err
		}
	}
	return nil
}

func nullable(v sql.NullString) *string {
	if !v.Valid {
		return nil
	}
	return &v.String
}

func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
