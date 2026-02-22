// api/internal/handlers/locations.go
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/api/internal/database"
)

type Location struct {
	LocationID int    `json:"location_id"`
	AreaName   string `json:"area_name"`
	City       string `json:"city"`
	RiskLevel  int    `json:"risk_level"`
}

func GetLocations(w http.ResponseWriter, r *http.Request) {
	// 1. Establish database connection
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	// 2. Query the Chennai mock data
	rows, err := conn.Query(context.Background(), "SELECT location_id, area_name, city, risk_level FROM locations")
	if err != nil {
		http.Error(w, "Query execution failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var locations []Location
	for rows.Next() {
		var loc Location
		err := rows.Scan(&loc.LocationID, &loc.AreaName, &loc.City, &loc.RiskLevel)
		if err != nil {
			continue
		}
		locations = append(locations, loc)
	}

	// 3. Set Headers and Return JSON
	w.Header().Set("Content-Type", "application/json")
	// CRITICAL: This allows Next.js to call your API from a different port
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") 
	json.NewEncoder(w).Encode(locations)
}