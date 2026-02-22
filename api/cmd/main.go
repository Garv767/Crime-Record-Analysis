//cmd/main.go
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
	// Load environment variables from the api/.env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Establish connection to the database
	conn, err := database.ConnectDB()
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer conn.Close(context.Background())

	fmt.Println("Successfully connected to the database!")

	// Initialize the router
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	// Simple health check route
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("API is up and running"))
	})

	r.Get("/locations", handlers.GetLocations)

	// Start server on port 8080
	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}