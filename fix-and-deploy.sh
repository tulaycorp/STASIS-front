#!/bin/bash

echo "🔧 Fixing Dockerfile and deploying..."

# Pull latest changes from the repository
git pull origin test

# Verify the Dockerfile has the correct reference
echo "📋 Checking Dockerfile..."
grep -n "COPY --from=" Dockerfile

# If it still shows 'build' instead of 'builder', fix it manually
sed -i 's/COPY --from=build/COPY --from=builder/g' Dockerfile

echo "✅ Dockerfile fixed. Starting deployment..."

# Run the deployment
./deploy.sh

echo "🚀 Deployment completed!"
