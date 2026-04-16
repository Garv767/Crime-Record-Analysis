// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles FIR (First Information Report) creation using a DB transaction.
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// CreateFIR handles POST /api/fir
//
// This handler demonstrates proper transactional database logic:
//  1. Begin a transaction
//  2. Insert a new record into fir_records
//  3. Update the corresponding crime's status
//  4. Commit — or rollback on any failure
//
// This ensures the DB never ends up in a partial state (e.g., FIR inserted
// but crime status not updated).
func CreateFIR(w http.ResponseWriter, r *http.Request) {
	// Decode the incoming JSON body into our request model
	var req models.NewFIRRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate the status field against allowed values
	validStatuses := map[string]bool{
		"Open": true, "Closed": true, "Under Investigation": true,
	}
	if !validStatuses[req.Status] {
		http.Error(w, `{"error":"status must be 'Open', 'Closed', or 'Under Investigation'"}`, http.StatusBadRequest)
		return
	}

	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	// --- Begin Transaction ---
	tx, err := conn.Begin(context.Background())
	if err != nil {
		http.Error(w, `{"error":"failed to begin transaction"}`, http.StatusInternalServerError)
		return
	}
	// Defer a rollback — if we reach Commit() below, this becomes a no-op.
	// If anything fails before Commit(), this cleans up the transaction.
	defer tx.Rollback(context.Background())

	// Step 1: Insert the new FIR record
	var newFIRID int
	err = tx.QueryRow(
		context.Background(),
		`INSERT INTO public.fir_records (crime_id, officer_id, fir_date, status)
		 VALUES ($1, $2, CURRENT_DATE, $3)
		 RETURNING fir_id`,
		req.CrimeID, req.OfficerID, req.Status,
	).Scan(&newFIRID)
	if err != nil {
		errStr := err.Error()
		errMsg := "failed to insert FIR"
		if strings.Contains(errStr, "unique constraint") {
			errMsg = "This incident already has an FIR registered."
		}
		http.Error(w, `{"error":"`+errMsg+`"}`, http.StatusConflict)
		return
	}

	// Step 2: Fetch officer name for Audit Log
	var officerName string
	err = tx.QueryRow(
		context.Background(),
		`SELECT name FROM public.police_officers WHERE officer_id = $1`,
		req.OfficerID,
	).Scan(&officerName)
	if err != nil {
		officerName = "Unknown Officer" // Fallback but continue
	}

	// Step 3: Process Victim Information
	if req.VictimName != "" {
		var victimID int
		// Check if victim exists by contact number
		err := tx.QueryRow(
			context.Background(),
			`SELECT victim_id FROM public.victims WHERE contact_no = $1 LIMIT 1`,
			req.VictimContact,
		).Scan(&victimID)

		if err != nil {
			// Insert new victim
			err = tx.QueryRow(
				context.Background(),
				`INSERT INTO public.victims (name, age, contact_no, address) VALUES ($1, $2, $3, $4) RETURNING victim_id`,
				req.VictimName, req.VictimAge, req.VictimContact, req.VictimAddress,
			).Scan(&victimID)
		}

		if err == nil {
			// Link victim to the incident (Crime record)
			_, err = tx.Exec(context.Background(), `UPDATE public.crimes SET victim_id = $1 WHERE crime_id = $2`, victimID, req.CrimeID)
			if err != nil {
				http.Error(w, `{"error":"failed to link victim to incident: `+err.Error()+`"}`, http.StatusInternalServerError)
				return
			}
		}
	}

	// Step 4: Write Audit Log for Technical Accountability
	_, err = tx.Exec(
		context.Background(),
		`INSERT INTO public.audit_logs (officer_name, action, target, timestamp) 
		 VALUES ($1, 'CREATE_FIR', $2, CURRENT_TIMESTAMP)`,
		officerName, fmt.Sprintf("FIR #%d for Crime #%d", newFIRID, req.CrimeID),
	)
	if err != nil {
		// Log error but prioritize completing the FIR filing
		// In a real system, audit failure might be fatal.
	}

	if err := tx.Commit(context.Background()); err != nil {
		http.Error(w, `{"error":"transaction commit failed"}`, http.StatusInternalServerError)
		return
	}

	// Return the newly created FIR ID as confirmation
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"message": "FIR filed successfully",
		"fir_id":  newFIRID,
	})
}

// GetFIRs handles GET /api/fir
func GetFIRs(w http.ResponseWriter, r *http.Request) {
	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	query := `
		SELECT 
			f.fir_id, f.fir_date, f.status, 
			c.crime_id, c.crime_type, c.occurrence_timestamp, COALESCE(c.description, '') as crime_desc,
			l.area_name,
			o.name as officer_name, o.badge_number,
			COALESCE(STRING_AGG(off.name, ', '), '') as linked_offenders
		FROM public.fir_records f
		JOIN public.crimes c ON f.crime_id = c.crime_id
		JOIN public.locations l ON c.location_id = l.location_id
		JOIN public.police_officers o ON f.officer_id = o.officer_id
		LEFT JOIN public.crime_offender co ON c.crime_id = co.crime_id
		LEFT JOIN public.offenders off ON co.offender_id = off.offender_id
		GROUP BY f.fir_id, c.crime_id, l.location_id, o.officer_id
		ORDER BY f.fir_date DESC, f.fir_id DESC
	`

	rows, err := conn.Query(context.Background(), query)
	if err != nil {
		http.Error(w, `{"error":"query failed: `+err.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	firs := []models.FIRDetailed{}
	for rows.Next() {
		var f models.FIRDetailed
		err := rows.Scan(
			&f.FIRID, &f.FIRDate, &f.Status,
			&f.CrimeID, &f.CrimeType, &f.OccurrenceTimestamp, &f.CrimeDesc,
			&f.AreaName,
			&f.OfficerName, &f.BadgeNumber,
			&f.LinkedOffenders,
		)
		if err != nil {
			continue
		}
		firs = append(firs, f)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(firs)
}

// UpdateFIRStatus handles PUT /api/fir/{fir_id}
func UpdateFIRStatus(w http.ResponseWriter, r *http.Request) {
	firID := chi.URLParam(r, "fir_id")
	if firID == "" {
		http.Error(w, `{"error":"missing fir_id"}`, http.StatusBadRequest)
		return
	}

	var req models.UpdateFIRStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{
		"Open": true, "Closed": true, "Under Investigation": true,
	}
	if !validStatuses[req.Status] {
		http.Error(w, `{"error":"invalid status"}`, http.StatusBadRequest)
		return
	}

	conn, err := database.ConnectDB()
	if err != nil {
		http.Error(w, `{"error":"database connection failed"}`, http.StatusInternalServerError)
		return
	}

	_, err = conn.Exec(context.Background(), `UPDATE public.fir_records SET status = $1 WHERE fir_id = $2`, req.Status, firID)
	if err != nil {
		http.Error(w, `{"error":"failed to update status"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Status updated successfully"})
}
