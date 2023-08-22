pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                // Checkout your source code from your Git repository
                checkout([$class: 'GitSCM', branches: [[name: '*/main']], userRemoteConfigs: [[url: 'https://github.com/muslim333/vaccine.git']]])
            }
        }
        
        stage('Build') {
            steps {
                // Build your Docker image using the Dockerfile in your project
                script {
                    def dockerImage = docker.build("vaccine-app:${env.BUILD_ID}")
                }
            }
        }
        
        stage('Deploy') {
            steps {
                // Deploy the Docker image to Docker Hub
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        dockerImage.push("usamashafique/angular:${env.BUILD_ID}")
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Clean up resources or perform post-build tasks
        }
    }
}
