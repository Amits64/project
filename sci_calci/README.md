# Deploying a Python Web Application on Kubernetes Cluster

In today's fast-paced software development world, deploying a Python web application on a Kubernetes cluster has become a critical part of modern software development and deployment practices. This deployment focuses on various aspects, including containerization using Docker, Kubernetes orchestration, the implementation of a CI/CD pipeline, code quality integration, and setting up effective monitoring and logging solutions. The primary goal is to automate deployment processes, enhance scalability, and leverage modern technologies for efficient web application management.

## Prerequisites

This tools should be installed on your vms:
- Docker
- Kubectl
- Helm
- Jenkins

## Step 1: Create Python Flask Web Application

Create a file and name it `app.py`. You file will look like this:
```python
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def calculator():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        expression = request.form['expression']
        result = eval(expression)
        return render_template('index.html', result=result)
    except:
        return render_template('index.html', result="Error")

if __name__ == '__main__':
    app.run(debug=True)

```

## Step 2: Containerize Python Flask Web Application

- Create a file and name it `requirements.txt` and put the name name of the dependencies. In our case the only dependency we need is `flask`. 
- Write the Dockerfile for the application. Your Dockerfile will look like this:
 
```
FROM python:3.7-slim
WORKDIR /app
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
COPY sci_calci/requirements.txt requirements.txt
RUN pip install -r requirements.txt
COPY sci_calci/ /app
EXPOSE 80
CMD ["python", "app.py"]
```
In this project we are running the application on port 3000 but you can choose any port number.

- Build image from Dockerfile and tag it with your dockerhub repository name. e.g.
`Docker build -t amits64/calci .` and push it to dockerhub.

## Step 3: Set Up Amazon EKS Cluster

To install eksctl on Linux, follow these steps:

1. Download the eksctl binary for Linux using curl:
   ```bash
   curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" -o eksctl.tar.gz
   ```

2. Extract the downloaded tarball:
   ```bash
   tar -xzvf eksctl.tar.gz
   ```

3. Move the eksctl binary to /usr/local/bin:
   ```bash
   sudo mv eksctl /usr/local/bin
   ```

4. Check the version of eksctl:
   ```bash
   eksctl version
   ```

`eksctl` is a command-line utility for Amazon Elastic Kubernetes Service (EKS). It simplifies the process of creating, managing, and operating Kubernetes clusters on AWS. Here are some common `eksctl` commands and their usage:

1. **Create an EKS Cluster:**
   ```bash
   eksctl create cluster --name k8s-cluster --region ap-south-1
   ```

   This command creates a new EKS cluster with the name "k8s-cluster" in the US West (Oregon) region. You can replace the cluster name and region with your preferred values.

2. **Delete an EKS Cluster:**
   ```bash
   eksctl delete cluster --name k8s-cluster
   ```

   This command deletes an EKS cluster with the specified name.

3. **Create a Node Group:**
   ```bash
   eksctl create nodegroup --cluster k8s-cluster --node-type t2.micro --nodes 2 --nodes-min 1 --nodes-max 3 --name my-nodegroup
   ```

   Use this command to create a new node group within an existing cluster. The `node-ami` flag specifies the Amazon Machine Image (AMI) to use for nodes.

4. **Scale a Node Group:**
   ```bash
   eksctl scale nodegroup --cluster k8s-cluster --nodes 5 --name my-nodegroup
   ```

   This command scales the specified node group to the desired number of nodes (in this case, 5).

5. **List Clusters:**
   ```bash
   eksctl get clusters
   ```

   Use this command to list all EKS clusters in your AWS account.

6. **Update a Cluster:**
   ```bash
   eksctl update cluster --name k8s-cluster
   ```

   This command updates the configuration of an existing cluster.

7. **Enable Add-Ons:**
   ```bash
   eksctl utils associate-iam-oidc-provider --region ap-south-1 --cluster k8s-cluster
   eksctl create iamserviceaccount --region ap-south-1 --name my-serviceaccount --namespace default --cluster k8s-cluster --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess --approve
   ```

   These commands enable IAM OIDC identity provider and create an IAM service account with associated policies.

8. **Manage IAM Roles for Service Accounts (IRSA):**
   ```bash
   eksctl utils associate-iam-oidc-provider --region ap-south-1 --cluster k8s-cluster
   eksctl create iamserviceaccount --region ap-south-1 --name my-serviceaccount --namespace default --cluster k8s-cluster --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess --approve
   ```

   These commands are used for IAM Roles for Service Accounts (IRSA) to grant AWS resources access to your EKS cluster.

9. **Enable Kubernetes Dashboard:**
   ```bash
   eksctl utils write-kubeconfig --cluster k8s-cluster
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.4.0/aio/deploy/recommended.yaml
   kubectl proxy
   ```

   These commands enable the Kubernetes Dashboard for your EKS cluster and allow you to access it via `kubectl proxy`.

10. **Update the Cluster Configuration:**
    ```bash
    eksctl update cluster --name k8s-cluster
    ```

    Use this command to update the configuration of an existing cluster.

## Step 4: Create a helm chart

- To Create a sample helm chart for your python project use command.

```
helm create calci
```

- Now we have to write `deployment.yaml` and `service.yaml` files and copy them to python-project/template/ directory

## Step 5: Implement Jenkins CI/CD Pipeline

- Log in to Jenkins server and install some plugins such as:  
a) Docker Pipeline  
b) Pipeline Utilities

- Now click `manage jenkins` and then go to `credentials` and create a new credentials for your dockerhub login. 

- Now create a pipeline job and write the pipeline script. Your Jenkinsfile should look something like this:
 
```
pipeline {
    agent any

    environment {
        registry = 'amits64'
        registryCredential = 'dockerhub'
        tag = "v${BUILD_NUMBER}"
    }

    stages {
        stage('Git Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [[url: 'https://github.com/Amits64/khut-project.git']]
                ])
                dir('sci_calci') {
                    // Define your Git-related operations here if needed
                }
            }
        }

        stage('Static Code Analysis') {
            steps {
                script {
                    // Execute SonarQube scanner
                    def sonarScannerImage = 'sonarsource/sonar-scanner-cli:latest'
                    docker.image(sonarScannerImage).inside() {
                        withSonarQubeEnv('SonarQube') {
                            sh """
                            sonar-scanner \
                            -Dsonar.host.url=http://192.168.10.11:9000/ \
                            -Dsonar.projectKey=project-2
                            """
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image
                    docker.build("${registry}/calci:${tag}", "-f sci_calci/Dockerfile .")
                }
            }
        }

        stage('Upload Image') {
            steps {
                script {
                    // Push the Docker image to the registry
                    docker.withRegistry('', registryCredential) {
                        docker.image("${registry}/calci:${tag}").push()
                    }
                }
            }
        }

        stage('Remove Unused Docker Image') {
            steps {
                script {
                    sh "docker rmi ${registry}/calci:${tag}"
                }
            }
        }

        stage('Deploying Container to Kubernetes') {
            steps {
                dir('sci_calci/calci') {
                    script {
                        // Check if the release "calci" exists
                        def releaseExists = sh(returnStatus: true, script: 'helm ls | grep -q "calci"') == 0
                        if (releaseExists) {
                            // Delete the release
                            sh 'helm delete calci'
                        }

                        // Install Helm chart
                        sh "helm install calci ./ --set appimage=amits64/calci:${tag} --set-file ca.crt=/etc/ca-certificates/update.d/jks-keystore"
                    }
                }
            }
        }
    }
}

```
In this Jenkinsfile my kubernetes cluster is running on another vm so I have used that server as worker node. If your Kubernetes cluster is running on same server you do not have to create a worker node.

- Now click on `Build Now` and after sometime you will get similar results like this: 
![Grafana Dashboard](./Screenshots/Screenshot%20(86).png "python-application")

## Step 6:Testing and Verification

Here we will verify that our application is successfully deployed on kubernetes or not.
- Now go to the kubernetes cluster and run `kubectl get deployments` you will get something like this:
```bash
jenkins@ubuntu2004:~$ kubectl get deployments
NAME                                          READY   UP-TO-DATE   AVAILABLE   AGE
calci                                         1/1     1            1           47m
my-kube-prometheus-stack-grafana              1/1     1            1           116m
my-kube-prometheus-stack-kube-state-metrics   1/1     1            1           116m
my-kube-prometheus-stack-operator             1/1     1            1           116m
```

## Step 7: Monitoring and Logging

In this Project we are using Prometheus and grafana to monitor our application. We are using helm charts to setup prometheus and Grafana. To setup prometheus and Grafana use command:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts  
helm repo update
helm install my-kube-prometheus-stack prometheus-community/kube-prometheus-stack
```

Now to go the kubernetes cluster and change the service type to NodePort service named `my-kube-prometheus-stack-grafana` run the command `kubectl get svc` you will get similar output: 
```bash
jenkins@ubuntu2004:~$ kubectl get svc
NAME                                                TYPE           CLUSTER-IP       EXTERNAL-IP                                                                PORT(S)                      AGE
alertmanager-operated                               ClusterIP      None             <none>                                                                     9093/TCP,9094/TCP,9094/UDP   112m
calci                                               LoadBalancer   10.100.237.233   ac58b436385a1478ea5ba8b6fd8d782c-1488132291.ap-south-1.elb.amazonaws.com   80:30596/TCP                 43m
kubernetes                                          ClusterIP      10.100.0.1       <none>                                                                     443/TCP                      16h
my-kube-prometheus-stack-alertmanager               ClusterIP      10.100.226.99    <none>                                                                     9093/TCP,8080/TCP            112m
my-kube-prometheus-stack-grafana                    LoadBalancer   10.100.254.140   a52142723e1b24380b55c15b0e1faf09-1902896777.ap-south-1.elb.amazonaws.com   80:31622/TCP                 112m
my-kube-prometheus-stack-kube-state-metrics         ClusterIP      10.100.110.6     <none>                                                                     8080/TCP                     112m
my-kube-prometheus-stack-operator                   ClusterIP      10.100.45.249    <none>                                                                     443/TCP                      112m
my-kube-prometheus-stack-prometheus                 ClusterIP      10.100.2.142     <none>                                                                     9090/TCP,8080/TCP            112m
my-kube-prometheus-stack-prometheus-node-exporter   ClusterIP      10.100.21.75     <none>                                                                     9100/TCP                     112m
prometheus-operated                                 ClusterIP      None             <none>                                                                     9090/TCP                     112m
```
Now run the command `minikube service my-kube-prometheus-stack-grafana` and you will be redirected to grafana dashboard. For username and password go to kubernetes cluster and run the command `kubectl edit secret my-kube-prometheus-stack-grafana`. You will get similar results like this: 
```
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
data:
  admin-password: cHJvbS1vcGVyYXRvcg==
  admin-user: YWRtaW4=
  ldap-toml: ""
kind: Secret
metadata:
  annotations:
    meta.helm.sh/release-name: my-kube-prometheus-stack
    meta.helm.sh/release-namespace: default
  creationTimestamp: "2023-10-03T16:44:48Z"
  labels:
    app.kubernetes.io/instance: my-kube-prometheus-stack
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: grafana
    app.kubernetes.io/version: 10.1.2
    helm.sh/chart: grafana-6.59.5
  name: my-kube-prometheus-stack-grafana
  namespace: default
  resourceVersion: "151556"
  uid: 5a9f95bd-a28b-4754-801e-69f67a09a5bf
type: Opaque
```
To decode this password use command:
```bash
echo -n "YWRtaW4==" | base64 --decode
echo -n "cHJvbS1vcGVyYXRvcg==" | base64 --decode
```
Now login to Grafana and create a new dashboard. And you will get a similar output
![image](https://github.com/Amits64/khut-project/assets/135766785/6cf2d010-5eb2-4555-a49b-da678aa371ca)

## SonarQube scan:
![image](https://github.com/Amits64/khut-project/assets/135766785/0d57a6d2-f6c1-469b-8cc7-6e6d50407e52)


## Contributing
Contributions are welcome! If you would like to contribute to this project, please follow our contribution guidelines.

## Contact
For any questions or inquiries, please contact chauhanamit090@hotmail.com.

## Happy calculating!

You can use this README.md template as a starting point and customize it with specific details about your sci_calci project.
