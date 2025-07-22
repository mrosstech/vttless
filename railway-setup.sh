#!/bin/bash

# Railway CLI setup script for multiple services

echo "Setting up Railway services..."

# Create backend service
railway service create backend
railway link --service backend
railway up --dockerfile Dockerfile.backend

# Create client service  
railway service create client
railway link --service client
railway up --dockerfile Dockerfile.client

# Create eventserver service
railway service create eventserver  
railway link --service eventserver
railway up --dockerfile Dockerfile.eventserver

echo "All services created! Configure environment variables in Railway dashboard."