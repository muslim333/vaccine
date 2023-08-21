# Stage 1: Build the Angular app
FROM node:16-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install app dependencies
RUN npm install -g npm@latest
RUN npm install -g @angular/cli@12.2.17  # Install a specific version of Angular CLI

# Copy the rest of the application code into the container
COPY . .

# Build the Angular app for production
RUN npm run build

# Stage 2: Create a lightweight production image
FROM nginx:alpine

# Copy the built Angular app from the previous build stage
COPY --from=build /app/dist/SchoolHealthApp /usr/share/nginx/html

# Expose the default port used by nginx (80)
EXPOSE 80

# Start the nginx server
CMD ["nginx", "-g", "daemon off;"]
