Welcome to the Ansible-NGINX-PROJECT
ABOUT NGINX:

NGINX is a widely used open-source web server, reverse proxy server, and load balancer known for its high performance, reliability, and scalability. It's commonly used to serve web content, handle HTTP requests, and perform various other tasks in web application infrastructure.

STEPS:

Start by setting up a separate environment.
sudo -i

apt update && apt upgrade -y

Make sure to change the password for the user/root for the new environment.

passwd root

Make sure to install Docker on the new environment using:

apt install docker.io

Do SSH onto the new environment from our Ansible server.
ssh-keygen -t rsa

ssh-copy-id -i root@192.168.10.10

Prompt to enter the password

root@192.168.10.10's password: <enter_password>

Number of key(s) added: 1

Execute below command to create nginx roles directory:
ansible-galaxy init nginx

nginx/ ├── defaults │   └── main.yml ├── files ├── handlers │   └── main.yml ├── meta │   └── main.yml ├── README.md ├── tasks │   └── main.yml ├── templates ├── tests │   ├── inventory │   └── test.yml └── vars └── main.yml

Now create a playbook.yml and inventory.yml file and mention below details:
playbook.yml

hosts: all

become: yes

roles:

nginx
inventory.yml [webserver] web01 ansible_host=192.168.10.10

Go to ./nginx/tasks/main.yml and enter below tasks for the NGINX configuration.
name: Update APT package cache (for Debian/Ubuntu) apt: update_cache: yes when: ansible_os_family == "Debian" # Adjust for other OS families

name: Install NGINX package: name: nginx state: present

name: Start NGINX service service: name: nginx state: started enabled: yes

name: Install NGINX (using a container image) docker_container: name: nginx-container image: nginx:latest state: started published_ports: - "90:90"

Make sure to involve python_interpreter in the "vars" directory. ansible_python_interpreter: /usr/bin/python3

Now run the playbook for installing NGINX on a Virtuall machine and as a container image.
ansible-playbook -i inventory.yml playbook.yml

============================================================================================ PLAY [all] ***************************************************************************************

TASK [Gathering Facts] ***************************************************************************

ok: [web01]

TASK [nginx : Update APT package cache (for Debian/Ubuntu)] **************************************

changed: [web01]

TASK [nginx : Install NGINX] *********************************************************************

changed: [web01]

TASK [nginx : Start NGINX service] ***************************************************************

ok: [web01]

TASK [nginx : Install NGINX (using a container image)] *******************************************

changed: [web01]

PLAY RECAP ***************************************************************************************

web01: ok=5 changed=3 unreachable=0 failed=0 skipped=0 rescued=0 ignored=0

============================================================================================

For verification run: docker images && docker ps

REPOSITORY TAG IMAGE ID CREATED SIZE nginx latest 61395b4c586d 2 weeks ago 187MB

CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES 65e1c06389e8 nginx:latest "/docker-entrypoint.…" About a minute ago Up About a minute 80/tcp, 0.0.0.0:90->90/tcp nginx-container

============================================================================================ curl http://192.168.10.10:80

<title>Welcome to nginx!</title> <style> body { width: 35em; margin: 0 auto; font-family: Tahoma, Verdana, Arial, sans-serif; } </style>
Welcome to nginx!
If you see this page, the nginx web server is successfully installed and working. Further configuration is required.

For online documentation and support please refer to nginx.org.
Commercial support is available at nginx.com.

Thank you for using nginx.

============================================================================================

Similarities:
Installation and Configuration: In both cases, NGINX is being installed and configured on the target system, whether it's a virtual machine or a container. The same NGINX configuration tasks are performed in both scenarios, such as updating the package cache, installing NGINX, starting the NGINX service, and specifying a published port.

Ansible Playbooks: Ansible is used to automate the deployment and management of NGINX in both cases. The same Ansible playbook structure and syntax are used to define the tasks, roles, and hosts for NGINX deployment.

Verification: After the deployment, verification steps are taken to ensure that NGINX is correctly installed and running. Docker images and containers are checked in both scenarios.

Access Verification: In both cases, the NGINX server's accessibility is verified by making an HTTP request to the server's IP address and port.

Differences:
Deployment Environment: The primary difference is the deployment environment. In the first scenario, NGINX is installed and configured directly on a virtual machine with a specific IP address (192.168.10.10). In the second scenario, NGINX is deployed as a Docker container on the same virtual machine.

Installation Method: In the virtual machine scenario, NGINX is installed using the system's package manager (apt). In contrast, in the container scenario, NGINX is pulled and run as a container image from Docker Hub (nginx:latest).

Port Mapping: In the container scenario, a specific port mapping is defined to expose NGINX externally (e.g., "0.0.0.0:90->90/tcp"). In the virtual machine scenario, NGINX is accessed directly through its IP address without port mapping.

Resource Isolation: Containers provide a level of resource isolation, making it easier to manage and isolate applications from the host system. In contrast, NGINX on a virtual machine shares the host's resources.

Resource Overhead: Running NGINX in a container typically incurs less resource overhead than running it directly on a virtual machine since containers share the host OS kernel.

Scalability: Containers are more lightweight and scalable, making it easier to deploy multiple NGINX instances on the same host if needed.

Summary:
The choice between deploying NGINX on a virtual machine or as a container depends on your specific use case and requirements. Containers offer benefits like isolation and scalability, while virtual machines may be more suitable for cases where you need a full OS environment or have specific hardware requirements.