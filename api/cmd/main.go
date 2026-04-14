// main.go is the entry point for the Crime Record & Pattern Analysis API.
// It loads configuration, establishes the database connection, registers
// all HTTP routes, and starts the server on port 8080.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	"github.com/Garv767/Crime-Record-Analysis/api/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/api/internal/handlers"
)

func main() {
	// Load .env so DATABASE_URL is available via os.Getenv
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file — make sure api/.env exists")
	}

	// Verify the database connection is reachable before accepting requests
	conn, err := database.ConnectDB()
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(context.Background())
	fmt.Println("✓ Database connection established")

	// --- Router Setup ---
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Logger)    // structured request logging
	r.Use(middleware.Recoverer) // catch panics, return 500 instead of crashing
	r.Use(corsMiddleware)       // allow Next.js dev server to call this API

	// Health check — used to verify the server is running
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// --- API Routes ---
	r.Route("/api", func(r chi.Router) {
		// Locations
		r.Get("/locations", handlers.GetLocations)

		// Crimes (supports ?type= filter e.g. /api/crimes?type=Theft)
		r.Get("/crimes", handlers.GetCrimes)

		// Offenders (ordered by repeat offence count)
		r.Get("/offenders", handlers.GetOffenders)

		// Hotspots — aggregated crime counts per location for the map
		r.Get("/hotspots", handlers.GetHotspots)

		// FIR filing — uses a DB transaction (Insert + Update + Commit/Rollback)
		r.Post("/fir", handlers.CreateFIR)
	})

	fmt.Println("✓ Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

// corsMiddleware adds the required headers so the Next.js frontend
// at localhost:3000 can make cross-origin requests to this API.
// In production, replace the wildcard with your actual domain.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight OPTIONS requests sent by browsers before POST
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}