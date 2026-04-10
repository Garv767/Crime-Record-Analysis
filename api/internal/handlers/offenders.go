// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles all offender-related endpoints.
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/api/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/api/internal/models"
)

// GetOffenders handles GET /api/offenders
// It returns all offenders with a linked_crimes_count calculated by
// aggregating the crime_offender join table — useful for repeat offender analysis.
func GetOffenders(w http.ResponseWriter, r *http.Request) {
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	// LEFT JOIN with crime_offender so offenders with zero crimes still appear.
	// COUNT(co.crime_id) gives the total crimes this offender has been linked to.
	query := `
		SELECT
			o.offender_id,
			o.name,
			o.age,
			o.address,
			o.previous_crimes_count,
			COUNT(co.crime_id) AS linked_crimes_count
		FROM public.offenders o
		LEFT JOIN public.crime_offender co ON o.offender_id = co.offender_id
		GROUP BY o.offender_id
		ORDER BY linked_crimes_count DESC, o.previous_crimes_count DESC
	`

	rows, err := conn.Query(context.Background(), query)
	if err != nil {
		http.Error(w, `{"error":"query failed"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	offenders := []models.Offender{}
	for rows.Next() {
		var o models.Offender
		err := rows.Scan(
			&o.OffenderID,
			&o.Name,
			&o.Age,
			&o.Address,
			&o.PreviousCrimesCount,
			&o.LinkedCrimesCount,
		)
		if err != nil {
			continue
		}
		offenders = append(offenders, o)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(offenders)
}
