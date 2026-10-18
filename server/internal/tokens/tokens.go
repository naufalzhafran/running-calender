// Package tokens manages super-admin API tokens. Only the SHA-256 hash of a
// token is stored; the plaintext is shown once when it is created.
package tokens

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
)

const prefix = "rc_"

var (
	ErrNotFound  = errors.New("token not found")
	ErrNameTaken = errors.New("token name already in use")
)

type Token struct {
	Name       string
	Prefix     string
	CreatedAt  string
	LastUsedAt *string
	RevokedAt  *string
}

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func hash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// Create generates a new token and returns its plaintext value.
func (s *Store) Create(ctx context.Context, name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", errors.New("name is required")
	}
	var exists int
	if err := s.db.QueryRowContext(ctx, "SELECT count(*) FROM api_tokens WHERE name = ?", name).Scan(&exists); err != nil {
		return "", err
	}
	if exists > 0 {
		return "", ErrNameTaken
	}

	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	token := prefix + base64.RawURLEncoding.EncodeToString(buf)

	_, err := s.db.ExecContext(ctx,
		"INSERT INTO api_tokens (name, token_hash, token_prefix) VALUES (?, ?, ?)",
		name, hash(token), token[:8])
	if err != nil {
		return "", err
	}
	return token, nil
}

// Verify returns the token's name when token is valid and not revoked, and
// records the time it was used.
func (s *Store) Verify(ctx context.Context, token string) (string, bool) {
	if !strings.HasPrefix(token, prefix) {
		return "", false
	}
	var name string
	err := s.db.QueryRowContext(ctx,
		"SELECT name FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL", hash(token)).Scan(&name)
	if err != nil {
		return "", false
	}
	s.db.ExecContext(ctx,
		"UPDATE api_tokens SET last_used_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE name = ?", name)
	return name, true
}

func (s *Store) List(ctx context.Context) ([]Token, error) {
	rows, err := s.db.QueryContext(ctx,
		"SELECT name, token_prefix, created_at, last_used_at, revoked_at FROM api_tokens ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []Token
	for rows.Next() {
		var t Token
		var used, revoked sql.NullString
		if err := rows.Scan(&t.Name, &t.Prefix, &t.CreatedAt, &used, &revoked); err != nil {
			return nil, err
		}
		if used.Valid {
			t.LastUsedAt = &used.String
		}
		if revoked.Valid {
			t.RevokedAt = &revoked.String
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

func (s *Store) Revoke(ctx context.Context, name string) error {
	res, err := s.db.ExecContext(ctx,
		"UPDATE api_tokens SET revoked_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE name = ? AND revoked_at IS NULL", name)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
