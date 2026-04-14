// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles the crime hotspot aggregation endpoint used by the map view.
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// GetHotspots handles GET /api/hotspots
// It aggregates crimes by location, returning each location's crime count
// alongside its lat/long and risk level — consumed by the Leaflet map component.
// Locations with zero crimes are excluded (INNER JOIN by design).
func GetHotspots(w http.ResponseWriter, r *http.Request) {
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	// Group crimes by location, counting incidents per area.
	// Only locations that have at least one crime appear — this keeps
	// the map meaningful rather than cluttered with zero-crime markers.
	query := `
		SELECT
			l.location_id,
			l.area_name,
			l.city,
			COALESCE(l.risk_level, 0) AS risk_level,
			COALESCE(l.latitude, 0.0) AS latitude,
			COALESCE(l.longitude, 0.0) AS longitude,
			COUNT(c.crime_id) AS crime_count
		FROM public.locations l
		INNER JOIN public.crimes c ON l.location_id = c.location_id
		GROUP BY l.location_id
		ORDER BY crime_count DESC
	`

	rows, err := conn.Query(context.Background(), query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	hotspots := []models.Hotspot{}
	for rows.Next() {
		var h models.Hotspot
		err := rows.Scan(
			&h.LocationID,
			&h.AreaName,
			&h.City,
			&h.RiskLevel,
			&h.Latitude,
			&h.Longitude,
			&h.CrimeCount,
		)
		if err != nil {
			continue
		}
		hotspots = append(hotspots, h)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(hotspots)
}
