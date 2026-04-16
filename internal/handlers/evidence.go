package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// GetEvidence fetches all evidence logged in the database.
func GetEvidence(w http.ResponseWriter, r *http.Request) {
	pool := database.GlobalPool
	if pool == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	query := `
		SELECT evidence_id, crime_id, description, collected_by, collection_date, status
		FROM public.evidence
		ORDER BY collection_date DESC
	`

	rows, err := pool.Query(r.Context(), query)
	if err != nil {
		http.Error(w, "Failed to fetch evidence", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var evidenceList []models.Evidence
	for rows.Next() {
		var e models.Evidence
		err := rows.Scan(
			&e.EvidenceID,
			&e.CrimeID,
			&e.Description,
			&e.CollectedBy,
			&e.CollectionDate,
			&e.Status,
		)
		if err != nil {
			http.Error(w, "Error parsing evidence data", http.StatusInternalServerError)
			return
		}
		evidenceList = append(evidenceList, e)
	}

	w.Header().Set("Content-Type", "application/json")
	if len(evidenceList) == 0 {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(evidenceList)
}

// CreateEvidence adds a new piece of evidence to the database.
func CreateEvidence(w http.ResponseWriter, r *http.Request) {
	var payload models.Evidence
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	pool := database.GlobalPool
	if pool == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	query := `
		INSERT INTO public.evidence (crime_id, description, collected_by, status)
		VALUES ($1, $2, $3, $4)
		RETURNING evidence_id, collection_date
	`
	err := pool.QueryRow(r.Context(), query, payload.CrimeID, payload.Description, payload.CollectedBy, payload.Status).Scan(&payload.EvidenceID, &payload.CollectionDate)
	if err != nil {
		// Detect common database constraint errors
		errMsg := "Failed to create evidence"
		status := http.StatusInternalServerError

		// Simple string matching for common pgx error messages
		errStr := err.Error()
		if strings.Contains(errStr, "violates foreign key constraint") {
			if strings.Contains(errStr, "crime_id") {
				errMsg = "Constraint Violation: Incident ID not found in database"
			} else if strings.Contains(errStr, "collected_by") {
				errMsg = "Constraint Violation: Officer ID not found in database"
			}
			status = http.StatusBadRequest
		} else if strings.Contains(errStr, "violates unique constraint") {
			errMsg = "Conflict: This item is already cataloged"
			status = http.StatusConflict
		}

		http.Error(w, `{"error":"`+errMsg+`"}`, status)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
