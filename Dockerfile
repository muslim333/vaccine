# Stage 1: Build the Angular app
FROM node:16-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install app dependencies
RUN npm install -g npm@latest
RUN npm install -g @angular/cli@12.2.17

# Copy the rest of the application code into the container
COPY . .
RUN npm install
# Build the Angular app for production
RUN npm run build

# Stage 2: Create a lightweight production image with Apache server
FROM httpd:alpine

# Copy the built Angular app from the previous build stage to Apache's document root
COPY --from=build /app/www /usr/local/apache2/htdocs/

# Expose the default port used by Apache (80)
EXPOSE 81

# Start the Apache server
CMD ["httpd", "-D", "FOREGROUND"]
