# Ansible NGINX Deployment Project

This project demonstrates the deployment of NGINX using Ansible, with options for deploying NGINX on a virtual machine or as a container.

# Ansible NGINX Deployment Project

## Introduction

This project demonstrates the deployment of NGINX using Ansible, with options for deploying NGINX on a virtual machine or as a container.

## Usage

### Prerequisites

Before running the Ansible playbook, ensure you have the following prerequisites installed:

- Ansible
- Docker (only required for container deployment)

### Steps

1. Clone this repository to your Ansible server:

   ```bash
   git clone https://github.com/your-username/ansible-nginx-project.git
   cd ansible-nginx-project

2. Update the Ansible inventory file (inventory.yml) with the target machine's details:

   ```bash
   [webserver]
   web01 ansible_host=<HOST_IP>  

3. Run the Ansible playbook to deploy NGINX:

   ```bash
   ansible-playbook -i inventory.yml playbook.yml

4. Verify the NGINX deployment:

   ```bas
   docker images  # Only for container deployment
   docker ps      # Only for container deployment
   curl http://192.168.10.10:80

# Customization
You can customize the NGINX deployment by modifying variables in the playbook (playbook.yml). For example, you can change the NGINX version or adjust published ports.

# Documentation

Ansible Documentation (https://www.ansible.com/)

NGINX Documentation (https://www.nginx.com/)

# Contributing

Contributions to this project are welcome! To contribute, please open an issue or submit a pull request.

Feel free to adapt and expand this README further to meet your project's specific needs and goals.
