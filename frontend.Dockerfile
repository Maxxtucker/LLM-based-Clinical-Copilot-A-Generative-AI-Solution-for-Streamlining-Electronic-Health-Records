# frontend.Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY frontend/package*.json ./

# Install all dependencies including devDependencies
RUN npm install --legacy-peer-deps --include=dev

# Copy the rest of the frontend source code
COPY frontend .

# Expose port for React dev server
EXPOSE 3000

# Start the frontend
CMD ["npm", "start"]
