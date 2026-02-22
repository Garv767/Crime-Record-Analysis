//db.go
package database

import (
	"context"
	"os"
	"github.com/jackc/pgx/v5"
)

func ConnectDB() (*pgx.Conn, error) {
	// DATABASE_URL from your .env file
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}
	return conn, nil
}