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

// CreateCrime handles POST /api/crimes
// It registers a new criminal incident in the system.
func CreateCrime(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		CrimeType   string `json:"crime_type"`
		Description string `json:"description"`
		LocationID  int    `json:"location_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Basic validation
	if payload.CrimeType == "" || payload.LocationID == 0 {
		http.Error(w, `{"error":"crime_type and location_id are required"}`, http.StatusBadRequest)
		return
	}

	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	query := `
		INSERT INTO public.crimes (crime_type, description, location_id, occurrence_timestamp)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		RETURNING crime_id, occurrence_timestamp
	`

	var crimeID int
	var timestamp string
	err = conn.QueryRow(context.Background(), query, payload.CrimeType, payload.Description, payload.LocationID).Scan(&crimeID, &timestamp)

	if err != nil {
		http.Error(w, `{"error":"failed to register incident: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message":   "Incident registered successfully",
		"crime_id":  crimeID,
		"timestamp": timestamp,
	})
}
