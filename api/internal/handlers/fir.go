// Package handlers provides HTTP handler functions for the Crime Record API.
// This file handles FIR (First Information Report) creation using a DB transaction.
package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/api/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/api/internal/models"
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
	defer conn.Close(context.Background())

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
		http.Error(w, `{"error":"failed to insert FIR — crime may already have a report"}`, http.StatusConflict)
		return
	}

	// Step 2: Update the crime's conceptual status by ensuring the FIR status matches.
	// (fir_records.status is the authoritative status field for a crime's investigation state)
	// This step future-proofs the schema if a direct status column is added to crimes.
	_, err = tx.Exec(
		context.Background(),
		`UPDATE public.fir_records SET status = $1 WHERE fir_id = $2`,
		req.Status, newFIRID,
	)
	if err != nil {
		http.Error(w, `{"error":"failed to update FIR status"}`, http.StatusInternalServerError)
		return
	}

	// --- Commit Transaction ---
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
