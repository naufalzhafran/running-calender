// Command api runs the Kalender Lari HTTP API and manages admin tokens.
//
//	api serve                     start the HTTP server
//	api token create --name NAME  create a token (printed once)
//	api token list                list tokens
//	api token revoke NAME         revoke a token
package main

import (
	"context"
	"database/sql"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"text/tabwriter"
	"time"

	"running-calendar/internal/db"
	"running-calendar/internal/events"
	"running-calendar/internal/httpapi"
	"running-calendar/internal/tokens"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func usage() {
	fmt.Fprint(os.Stderr, `usage:
  api serve
  api token create --name NAME
  api token list
  api token revoke NAME

environment:
  ADDR          listen address (default :8080)
  DB_PATH       SQLite file (default ./data/app.db)
  WEB_ROOT      static site directory (default ../web)
  SITE_URL      public origin for meta tags, e.g. https://running.madebynz.xyz
  SERVE_STATIC  "1" to also serve WEB_ROOT (local development)
`)
	os.Exit(2)
}

func main() {
	log.SetFlags(log.LstdFlags | log.LUTC)
	if len(os.Args) < 2 {
		usage()
	}

	ctx := context.Background()
	conn, err := db.Open(ctx, env("DB_PATH", "./data/app.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	switch os.Args[1] {
	case "serve":
		serve(conn)
	case "token":
		tokenCommand(ctx, tokens.NewStore(conn), os.Args[2:])
	default:
		usage()
	}
}

func serve(conn *sql.DB) {
	handler := httpapi.New(httpapi.Config{
		WebRoot:     env("WEB_ROOT", "../web"),
		SiteURL:     os.Getenv("SITE_URL"),
		ServeStatic: os.Getenv("SERVE_STATIC") == "1",
	}, events.NewStore(conn), tokens.NewStore(conn))

	srv := &http.Server{
		Addr:              env("ADDR", ":8080"),
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		log.Printf("listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

func tokenCommand(ctx context.Context, store *tokens.Store, args []string) {
	if len(args) == 0 {
		usage()
	}
	switch args[0] {
	case "create":
		fs := flag.NewFlagSet("token create", flag.ExitOnError)
		name := fs.String("name", "", "token name, e.g. laptop")
		fs.Parse(args[1:])
		token, err := store.Create(ctx, *name)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(token)
		fmt.Fprintln(os.Stderr, "Token created. It is shown only once; store it somewhere safe.")
	case "list":
		list, err := store.List(ctx)
		if err != nil {
			log.Fatal(err)
		}
		tw := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)
		fmt.Fprintln(tw, "NAME\tPREFIX\tCREATED\tLAST USED\tREVOKED")
		for _, t := range list {
			fmt.Fprintf(tw, "%s\t%s…\t%s\t%s\t%s\n", t.Name, t.Prefix, t.CreatedAt, orDash(t.LastUsedAt), orDash(t.RevokedAt))
		}
		tw.Flush()
	case "revoke":
		if len(args) < 2 {
			usage()
		}
		if err := store.Revoke(ctx, args[1]); err != nil {
			log.Fatal(err)
		}
		fmt.Println("revoked", args[1])
	default:
		usage()
	}
}

func orDash(s *string) string {
	if s == nil {
		return "-"
	}
	return *s
}
