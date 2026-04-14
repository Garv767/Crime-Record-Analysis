package main

import (
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	chiadapter "github.com/awslabs/aws-lambda-go-api-proxy/chi"
	"github.com/joho/godotenv"
	"github.com/Garv767/Crime-Record-Analysis/internal/database"
	"github.com/Garv767/Crime-Record-Analysis/internal/router"
)

var chiLambda *chiadapter.ChiLambda

func init() {
	log.Printf("Starting Netlify Function: Cold Start")

	// Try loading from different possible paths locally
	if err := godotenv.Load(); err != nil {
		// If fails, try one level up (root) or frontend folder
		_ = godotenv.Load("../../.env")
		_ = godotenv.Load("../../../.env")
	}

	pool, err := database.ConnectDB()
	if err != nil {
		log.Printf("DATABASE ERROR DURING INIT: %v", err)
		// We don't log.Fatal here because we want the function to start
		// so we can return the error through HTTP rather than a 502/500 crash.
	} else {
		log.Printf("Database pool initialized successfully")
		_ = pool
	}

	// 2. Setup the Chi router and create the adapter
	chiLambda = chiadapter.New(router.SetupRouter())
}

// Handler is the entry point for Netlify/Lambda
func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Proxy the request through the Chi router
	return chiLambda.ProxyWithContext(ctx, req)
}

func main() {
	lambda.Start(Handler)
}
