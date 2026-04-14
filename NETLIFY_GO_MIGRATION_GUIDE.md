# Guide: Migrating Go Backend to Netlify Functions

This guide outlines the "Fat Function" strategy used to migrate a standard Go HTTP server (using Chi, Gin, or Echo) into a serverless Netlify environment.

---

## 1. Project Architecture
Instead of creating many small functions, we use a single **"Fat Function"**. 

- **Benefit**: Shares database connection pools, easier to manage routing, and simpler deployment.
- **Location**: Typically `netlify/functions/api/main.go`.

## 2. Dependencies
You will need two key libraries to bridge standard Go HTTP to Lambda:

```bash
go get github.com/aws/aws-lambda-go
go get github.com/awslabs/aws-lambda-go-api-proxy
```

## 3. The Adapter Pattern
The core trick is wrapping your existing `http.Handler` (your router) with a Lambda adapter.

### Example `netlify/functions/api/main.go`
```go
package main

import (
    "context"
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
    "github.com/awslabs/aws-lambda-go-api-proxy/chi" // Or gin/echo
    "your-project/internal/router"
    "your-project/internal/database"
)

var adapter *chiadapter.ChiAdapter

func init() {
    // 1. Initialize your DB pool (Global)
    db, _ := database.ConnectDB()
    
    // 2. Setup your existing router
    r := router.SetupRouter(db)
    
    // 3. Wrap it in the adapter
    adapter = chiadapter.New(r)
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    // Bridges the Lambda request to your Chi/standard router
    return adapter.ProxyWithContext(ctx, req)
}

func main() {
    lambda.Start(Handler)
}
```

---

## 4. Database Connection Pooling
In serverless, you MUST use a connection pool (like `pgxpool`) and initialize it in the `init()` function or globally. This allows the connection to be **reused** during "warm starts," avoiding the 1-2 second connection overhead on every request.

> [!IMPORTANT]
> **Supabase / PgBouncer Tip**:
> If using Supabase on port 6543 (Transaction Mode), you **must** disable statement caching in your Go driver to avoid "prepared statement already exists" errors.
> ```go
> config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
> ```

---

## 5. Netlify Configuration (`netlify.toml`)
Configure Netlify to build the Go function and proxy requests from the frontend.

```toml
[build]
  command = "go build -o netlify/functions/api ./netlify/functions/api"
  functions = "netlify/functions"
  publish = "frontend/out" # Or your frontend build dir

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

---

## 6. Monorepo Structure
Keep the Go module at the **root** of the repository. Netlify's Go builder works best when it can find `go.mod` in the root.

```text
/
├── go.mod
├── internal/        # Shared Go logic (DB, Models, Handlers)
├── netlify/
│   └── functions/
│       └── api/
│           └── main.go  # Serverless Entry Point
├── frontend/        # Next.js / Vite app
└── netlify.toml
```

---

## 7. Local Development
Use the Netlify CLI to test the entire flow locally:

```bash
npx netlify dev
```

This handles:
1. Loading your `.env` file.
2. Compiling your Go function.
3. Proxying `/api/*` from the frontend to the Go function automatically.

---

## 8. Checklist for Migration
- [ ] Move `go.mod` to the root.
- [ ] Abstract your router into a `SetupRouter()` function that returns an `http.Handler`.
- [ ] Use `COALESCE` in SQL queries to handle `NULL` values safely.
- [ ] Ensure all API paths are **relative** in the frontend (e.g., `/api/data` instead of `http://localhost:8080/api/data`).
