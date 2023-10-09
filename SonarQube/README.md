# Performing a gap analysis using SonarQube for Node.js codebase

Step 1: Set Up SonarQube
Install Docker (if not already installed):

1. You can follow the official Docker installation guide for your operating system.

2. Pull the SonarQube Docker Image:
     Open your terminal and run the following command to pull the SonarQube Docker image:
   
  ```bash
  docker pull sonarqube:latest

Run SonarQube Container:

3. Start a SonarQube container with the following command:

  ```bash
  docker run -d --name sonarqube -p 9000:9000 -p 9092:9092 sonarqube:latest
