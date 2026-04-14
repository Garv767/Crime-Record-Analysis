package handlers

import (
	"encoding/json"
	"net/http"

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
