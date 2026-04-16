package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// GetVictims fetches all victims listed in the database.
func GetVictims(w http.ResponseWriter, r *http.Request) {
	pool := database.GlobalPool
	if pool == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	query := `
		SELECT victim_id, name, age, contact_no, address
		FROM public.victims
		ORDER BY victim_id DESC
	`

	rows, err := pool.Query(r.Context(), query)
	if err != nil {
		http.Error(w, "Failed to fetch victims", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var victims []models.Victim
	for rows.Next() {
		var v models.Victim
		// Using pointer fallback for nullable fields if necessary, though Schema says some might be null.
		// For simplicity, we just scan straight.
		err := rows.Scan(
			&v.VictimID,
			&v.Name,
			&v.Age,
			&v.ContactNo,
			&v.Address,
		)
		if err != nil {
			http.Error(w, "Error parsing victim data", http.StatusInternalServerError)
			return
		}
		victims = append(victims, v)
	}

	w.Header().Set("Content-Type", "application/json")
	if len(victims) == 0 {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(victims)
}

// CreateVictim adds a new victim to the database.
func CreateVictim(w http.ResponseWriter, r *http.Request) {
	var payload models.Victim
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	pool := database.GlobalPool
	if pool == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	// Check if already exist by Contact number (simplistic check to prevent duplicate logic)
	var existingId int
	err := pool.QueryRow(r.Context(), "SELECT victim_id FROM public.victims WHERE contact_no = $1 AND contact_no != '' LIMIT 1", payload.ContactNo).Scan(&existingId)
	if err == nil {
		// Found existing
		payload.VictimID = existingId
		// We could update it, but let's just return it for now.
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(payload)
		return
	}

	query := `
		INSERT INTO public.victims (name, age, contact_no, address)
		VALUES ($1, $2, $3, $4)
		RETURNING victim_id
	`
	err = pool.QueryRow(r.Context(), query, payload.Name, payload.Age, payload.ContactNo, payload.Address).Scan(&payload.VictimID)
	if err != nil {
		http.Error(w, "Failed to create victim", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}
