// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles location-related endpoints.
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// GetLocations handles GET /api/locations
// Returns all tracked locations with their risk level and coordinates.
// The lat/long fields are consumed by the frontend Leaflet map.
func GetLocations(w http.ResponseWriter, r *http.Request) {
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	rows, err := conn.Query(
		context.Background(),
		`SELECT location_id, area_name, city, zone, risk_level, latitude, longitude
		 FROM public.locations
		 ORDER BY risk_level DESC`,
	)
	if err != nil {
		http.Error(w, `{"error":"query failed"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	locations := []models.Location{}
	for rows.Next() {
		var loc models.Location
		err := rows.Scan(
			&loc.LocationID,
			&loc.AreaName,
			&loc.City,
			&loc.Zone,
			&loc.RiskLevel,
			&loc.Latitude,
			&loc.Longitude,
		)
		if err != nil {
			continue
		}
		locations = append(locations, loc)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(locations)
}