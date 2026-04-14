//db.go
package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var GlobalPool *pgxpool.Pool

func ConnectDB() (*pgxpool.Pool, error) {
	if GlobalPool != nil {
		return GlobalPool, nil
	}

	// DATABASE_URL from your env settings
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, err
	}

	// For serverless, keep the pool small to avoid exhausting DB connections
	config.MaxConns = 2

	// FORCE SimpleProtocol to avoid "prepared statement already exists" errors
	// with Supabase/PgBouncer connection poolers in Transaction Mode.
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	GlobalPool = pool
	return pool, nil
}