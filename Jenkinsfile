pipeline {
    agent any
    
    stages {
        stage('Clone Code') {
            steps {
                echo "Cloning the code"
                git url: "https://github.com/muslim333/vaccine.git", branch: "master"
            }
        }
        
        stage('Build') {
            steps {
                echo "Building the image"
                sh "docker build -t vaccine-app ."
            }
        }
        stage("push  to Docker hub"){
            steps {
                echo "Pushing the image to docker hub"
                withCredentials([usernamePassword(credentialsId:"Dockerhub",passwordVariable:"DockerhubPass",usernameVariable:"DockerhubUser")]){
                sh "docker tag vaccine-app ${env.DockerhubUser}/vaccine-app:latest"
                sh "docker login -u ${env.DockerhubUser} -p ${env.DockerhubPass}"
                sh "docker push ${env.DockerhubUser}/vaccine-app:latest"
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo "Deploying the container"
                sh "docker-compose down && docker-compose up -d"
                
            }
        }
    }
}
