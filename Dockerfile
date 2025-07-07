# Dockerfile

# ---- Stage 1: Build the application ----
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (including devDependencies for the build)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the application for production
RUN npm run build

# ---- Stage 2: Serve the application with Nginx ----
FROM nginx:stable-alpine

# Copy the custom server configuration to the correct directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
# The source path '/app/build' is standard for Create React App. 
# Adjust if your build output is in a different folder (e.g., 'dist').
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]