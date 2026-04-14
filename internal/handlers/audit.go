package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/models"
)

// GetAuditLogs fetches all system audit logs.
func GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	pool := database.GlobalPool
	if pool == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	query := `
		SELECT log_id, officer_name, action, target, timestamp, ip_address
		FROM public.audit_logs
		ORDER BY timestamp DESC
	`

	rows, err := pool.Query(r.Context(), query)
	if err != nil {
		http.Error(w, "Failed to fetch audit logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		err := rows.Scan(
			&l.LogID,
			&l.OfficerName,
			&l.Action,
			&l.Target,
			&l.Timestamp,
			&l.IPAddress,
		)
		if err != nil {
			http.Error(w, "Error parsing audit data", http.StatusInternalServerError)
			return
		}
		logs = append(logs, l)
	}

	w.Header().Set("Content-Type", "application/json")
	if len(logs) == 0 {
		w.Write([]byte("[]"))
		return
	}
	json.NewEncoder(w).Encode(logs)
}
