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
