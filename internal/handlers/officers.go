package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// GetOfficers fetches all police officers from the database.
func GetOfficers(w http.ResponseWriter, r *http.Request) {
	pool := database.GlobalPool
	if pool == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	query := `
		SELECT officer_id, name, badge_number, rank, station
		FROM public.police_officers
		ORDER BY rank, name
	`

	rows, err := pool.Query(r.Context(), query)
	if err != nil {
		http.Error(w, "Failed to fetch officers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var officers []models.PoliceOfficer
	for rows.Next() {
		var o models.PoliceOfficer
		err := rows.Scan(
			&o.OfficerID,
			&o.Name,
			&o.BadgeNumber,
			&o.Rank,
			&o.Station,
		)
		if err != nil {
			http.Error(w, "Error parsing officer data", http.StatusInternalServerError)
			return
		}
		officers = append(officers, o)
	}

	w.Header().Set("Content-Type", "application/json")
	if len(officers) == 0 {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(officers)
}

// CreateOfficer adds a new police officer to the database.
func CreateOfficer(w http.ResponseWriter, r *http.Request) {
	var payload models.PoliceOfficer
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
		INSERT INTO public.police_officers (name, badge_number, rank, station)
		VALUES ($1, $2, $3, $4)
		RETURNING officer_id
	`
	err := pool.QueryRow(r.Context(), query, payload.Name, payload.BadgeNumber, payload.Rank, payload.Station).Scan(&payload.OfficerID)
	if err != nil {
		http.Error(w, "Failed to create officer", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(payload)
}
