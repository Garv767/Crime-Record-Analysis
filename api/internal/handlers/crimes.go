// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles all crime-related endpoints.
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/api/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/api/internal/models"
)

// GetCrimes handles GET /api/crimes
// It fetches all crimes joined with their location details.
// Optional query param: ?type=Theft (filters by crime_type, case-insensitive).
func GetCrimes(w http.ResponseWriter, r *http.Request) {
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	// Base query: JOIN crimes with locations to include area context
	query := `
		SELECT
			c.crime_id,
			c.crime_type,
			c.occurrence_timestamp,
			c.description,
			c.location_id,
			l.area_name,
			l.risk_level
		FROM public.crimes c
		LEFT JOIN public.locations l ON c.location_id = l.location_id
	`

	// Apply optional crime type filter
	args := []any{}
	if crimeType := r.URL.Query().Get("type"); crimeType != "" {
		query += " WHERE LOWER(c.crime_type) = LOWER($1)"
		args = append(args, crimeType)
	}

	query += " ORDER BY c.occurrence_timestamp DESC"

	rows, err := conn.Query(context.Background(), query, args...)
	if err != nil {
		http.Error(w, `{"error":"query failed"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	crimes := []models.Crime{}
	for rows.Next() {
		var c models.Crime
		err := rows.Scan(
			&c.CrimeID,
			&c.CrimeType,
			&c.OccurrenceTimestamp,
			&c.Description,
			&c.LocationID,
			&c.AreaName,
			&c.RiskLevel,
		)
		if err != nil {
			continue // skip malformed rows, don't crash the whole response
		}
		crimes = append(crimes, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(crimes)
}
