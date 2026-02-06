# Crime Record & Pattern Analysis Database System
**Student Name:** Garv Rahut  
**Register Number:** RA2411003010718  
**University:** SRM Institute of Science and Technology, Kattankulathur  
[cite_start]**Course Code:** 21CSC205P - Database Management Systems [cite: 11]

---

## 1. Project Overview
[cite_start]In many regions, crime-related data is still managed using fragmented systems, paper records, or basic digital storage without proper analytical support[cite: 1]. [cite_start]This makes it difficult for law enforcement agencies to efficiently track incidents, identify repeat offenders, analyze crime patterns, and determine high-risk areas[cite: 2].

[cite_start]The **Crime Record & Pattern Analysis Database System** provides a centralized relational database that enables efficient record management and advanced analytical querying[cite: 6]. [cite_start]It allows authorities to monitor crime trends, detect crime-prone areas, and improve decision-making for crime prevention through structured data analysis[cite: 7].

---

## 2. Tech Stack
* **Database:** PostgreSQL (Cloud-hosted via **Supabase**)
* **Design Tool:** **dbdiagram.io** (Code-First ER Modeling)
* **Version Control:** GitHub

---

## 3. ER Model (Entity-Relationship)
The ER model for this system is designed to capture the complexity of criminal investigations while maintaining a clean relational structure.



### Entities and Attributes:
* **Offenders:** `offender_id` (PK), `first_name`, `last_name`, `date_of_birth`, `gender`, `physical_desc`, `prior_conviction_count`, `fingerprint_data`.
* **Crime_Categories:** `category_id` (PK), `category_name`, `crime_type`, `max_penalty`.
* **Locations:** `location_id` (PK), `area_name`, `district`, `city`, `risk_level`.
* **Incidents:** `incident_id` (PK), `offender_id` (FK), `category_id` (FK), `location_id` (FK), `occurrence_timestamp`, `description`, `status`.
* **Officers:** `officer_id` (PK), `name`, `badge_number` (Unique), `rank`, `station_branch`.
* **Assignments:** `assignment_id` (PK), `incident_id` (FK), `officer_id` (FK), `assignment_date`.

---

## 4. ER Logic & Cardinality
The system utilizes the following logical relationships to ensure data integrity and analytical capability:

* [cite_start]**Offender to Incidents (1:N):** One offender can be involved in multiple incidents (enables Repeat Offender Identification)[cite: 5].
* [cite_start]**Locations to Incidents (1:N):** A single location can have multiple crime incidents (enables Area-wise Statistics and Hotspot Analysis)[cite: 5].
* **Crime_Categories to Incidents (1:N):** Each incident is classified under one category, but one category can apply to many incidents.
* **Incidents to Assignments (1:N):** A single incident may be assigned to multiple officers for investigation.
* **Officers to Assignments (1:N):** One officer can handle multiple case assignments simultaneously.

---

## 5. Relational Mapping & Table Schema
[cite_start]The ER model is mapped to a relational schema using **Primary Keys (PK)** for unique identification and **Foreign Keys (FK)** to maintain referential integrity between tables.

