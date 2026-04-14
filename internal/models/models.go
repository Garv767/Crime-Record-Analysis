// Package models defines the data structures (structs) that mirror the
// PostgreSQL tables in the Crime Record & Pattern Analysis database.
// Each field's json tag maps directly to the snake_case column names
// returned by the API so the frontend can deserialize them cleanly.
package models

import "time"

// Location represents a geographic area tracked by the system.
// The RiskLevel (1–10) is used by the frontend map to colour-code markers.
type Location struct {
	LocationID int     `json:"location_id"`
	AreaName   string  `json:"area_name"`
	City       string  `json:"city"`
	Zone       string  `json:"zone"`
	RiskLevel  int     `json:"risk_level"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
}

// Crime represents a single criminal incident linked to a location and victim.
type Crime struct {
	CrimeID             int       `json:"crime_id"`
	CrimeType           string    `json:"crime_type"`
	OccurrenceTimestamp time.Time `json:"occurrence_timestamp"`
	Description         string    `json:"description"`
	LocationID          int       `json:"location_id"`
	// Joined fields — populated by the /api/crimes JOIN query
	AreaName  string `json:"area_name"`
	RiskLevel int    `json:"risk_level"`
}

// Offender represents a known criminal in the database.
// PreviousCrimesCount is used for repeat-offender analysis.
type Offender struct {
	OffenderID          int    `json:"offender_id"`
	Name                string `json:"name"`
	Age                 int    `json:"age"`
	Address             string `json:"address"`
	PreviousCrimesCount int    `json:"previous_crimes_count"`
	// Joined field — total crimes linked via crime_offender table
	LinkedCrimesCount int `json:"linked_crimes_count"`
}

// Hotspot is a derived view used by the crime map page.
// It aggregates crimes per location to determine which areas are high-risk.
type Hotspot struct {
	LocationID  int     `json:"location_id"`
	AreaName    string  `json:"area_name"`
	City        string  `json:"city"`
	RiskLevel   int     `json:"risk_level"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	CrimeCount  int     `json:"crime_count"`
}

// PoliceOfficer represents a law enforcement officer who can be assigned to FIRs.
type PoliceOfficer struct {
	OfficerID   int    `json:"officer_id"`
	Name        string `json:"name"`
	BadgeNumber int    `json:"badge_number"`
	Rank        string `json:"rank"`
	Station     string `json:"station"`
}

// FIRRecord represents a First Information Report.
// Status must be one of: 'Open', 'Closed', 'Under Investigation'.
type FIRRecord struct {
	FIRID     int       `json:"fir_id"`
	CrimeID   int       `json:"crime_id"`
	OfficerID int       `json:"officer_id"`
	FIRDate   time.Time `json:"fir_date"`
	Status    string    `json:"status"`
}

// NewFIRRequest is the payload accepted by POST /api/fir.
// The handler uses this to execute the transactional insert.
type NewFIRRequest struct {
	CrimeID   int    `json:"crime_id"`
	OfficerID int    `json:"officer_id"`
	Status    string `json:"status"`
}
