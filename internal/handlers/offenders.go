// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles all offender-related endpoints.
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
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

	// LEFT JOIN with crime_offender so offenders with zero crimes still appear.
	// COUNT(co.crime_id) gives the total crimes this offender has been linked to.
	query := `
		SELECT
			o.offender_id,
			o.name,
			COALESCE(o.age, 0) AS age,
			COALESCE(o.address, '') AS address,
			COALESCE(o.previous_crimes_count, 0) AS previous_crimes_count,
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

// LinkOffenderToCrime handles POST /api/offenders/link
func LinkOffenderToCrime(w http.ResponseWriter, r *http.Request) {
	var req models.LinkOffenderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.CrimeID == 0 || req.OffenderID == 0 || req.Role == "" {
		http.Error(w, `{"error":"missing required fields"}`, http.StatusBadRequest)
		return
	}

	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	tx, err := conn.Begin(context.Background())
	if err != nil {
		http.Error(w, `{"error":"failed to begin transaction"}`, http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	// Insert the link
	_, err = tx.Exec(
		context.Background(),
		`INSERT INTO public.crime_offender (crime_id, offender_id, role_in_crime) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
		req.CrimeID, req.OffenderID, req.Role,
	)
	if err != nil {
		http.Error(w, `{"error":"failed to link offender: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}

	// Insert audit log
	_, err = tx.Exec(
		context.Background(),
		`INSERT INTO public.audit_logs (officer_name, action, target, timestamp) 
		 VALUES ($1, 'IDENTIFY_OFFENDER', $2, CURRENT_TIMESTAMP)`,
		"System", fmt.Sprintf("Linked Offender #%d to Crime #%d", req.OffenderID, req.CrimeID),
	)
	if err != nil {
		// Just log it or ignore, don't fail the link over an audit failure
	}

	if err := tx.Commit(context.Background()); err != nil {
		http.Error(w, `{"error":"transaction commit failed"}`, http.StatusInternalServerError)
		return
	}

	// OK
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Offender linked successfully"})
}
