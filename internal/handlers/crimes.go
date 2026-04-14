// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles all crime-related endpoints.
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
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

	// Base query: JOIN crimes with locations to include area context
	query := `
		SELECT
			c.crime_id,
			c.crime_type,
			c.occurrence_timestamp,
			COALESCE(c.description, '') AS description,
			COALESCE(c.location_id, 0) AS location_id,
			COALESCE(l.area_name, 'Unknown') AS area_name,
			COALESCE(l.risk_level, 0) AS risk_level
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

// GetCrimeTypes handles GET /api/crime-types
// It returns a list of unique crime types currently in the records.
func GetCrimeTypes(w http.ResponseWriter, r *http.Request) {
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	query := `SELECT DISTINCT crime_type FROM public.crimes ORDER BY crime_type ASC`
	rows, err := conn.Query(context.Background(), query)
	if err != nil {
		http.Error(w, `{"error":"query failed"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	types := []string{}
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err == nil {
			types = append(types, t)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(types)
}
