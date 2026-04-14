package main

import (

	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"
	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/router"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize the database connection pool
	pool, err := database.ConnectDB()
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer pool.Close()
	fmt.Println("✓ Database connection established")

	// Setup the router
	r := router.SetupRouter()

	fmt.Println("✓ Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}