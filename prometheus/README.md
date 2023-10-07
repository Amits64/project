# Install Nginx

To install the latest stable nginx version, we need to add an official nginx repository. First of all, before installing Nginx itself, we need to install some prerequisites.


sudo apt update
sudo apt install curl gnupg2 ca-certificates lsb-release ubuntu-keyring

Import an official nginx signing key so apt could verify the packages authenticity.


curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
Verify that the downloaded file contains the proper key. If the fingerprint is different, remove the file.


gpg --dry-run --quiet --no-keyring --import --import-options import-show /usr/share/keyrings/nginx-archive-keyring.gpg
To set up the apt repository for stable nginx packages, run the following command:


echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu `lsb_release -cs` nginx" | sudo tee /etc/apt/sources.list.d/nginx.list
To install nginx, run the following commands:


sudo apt update
apt-cache policy nginx
sudo apt install nginx=1.22.1-1~jammy
Let's make sure that the basic metric module is configured with the nginx.


nginx -V
You should be able to find --with-http_stub_status_module in the output. If you don't have it, you need to compile Nginx with this module or use the dynamic modules.

Let's check if the Nginx is running.


sudo systemctl status nginx
In case it's not, let's start it.


sudo systemctl start nginx
Now it should be in a running state.


sudo systemctl status nginx
Let's use the Ubuntu IP address (http://<ip>/) to check if we can access Nginx.

Expose Basic Nginx Metrics¶
Let's create a new Nginx configuration file to add an additional server block with our metric module. If you used a different method to install Nginx, for example, default Ubuntu packages, you might have a different location for Nginx configurations.

Before creating a file, let me switch to the root Linux user. Later we will adjust Linux permissions and ownership.


sudo -s
Now the configuration file.


vim /etc/nginx/conf.d/status.conf
Optionally you can restrict this plugin to emit metrics to only the local host. It may be useful if you have a single Nginx instance and you install prometheus exporter on it as well. In case you have multiple Nginx servers, it's better to deploy the prometheus exporter on a separate instance and scrape all of them from a single exporter.

We'll use the location Nginx directive to expose basic metrics on port 8080 /status page.

nginx/status.conf

server {
    listen 8080;
    # Optionally: allow access only from localhost
    # listen 127.0.0.1:8080;

    server_name _;

    location /status {
        stub_status;
    }
}
Always verify if the configuration is valid before restarting Nginx.


nginx -t
To update the Nginx config without downtime, you can use reload command.


systemctl reload nginx
Now we can access http://<ip>:8080/status page.


Active connections: 2 
server accepts handled requests
 4 4 3 
Reading: 0 Writing: 1 Waiting: 1 
Unfortunately, Open Source Nginx server only exposes these not-very useful metrics. I guess I would pay attention only to the active connections metric from here.

They decided to only provide meaningful metrics in the enterprise version of Nginx, which is called Nginx plus. I'll show you how to get around later in the tutorial.

Install Nginx Prometheus Exporter¶
Still, let's fetch all the available metrics for now. We'll use the Nginx prometheus exporter to do that. It's a Golang application that compiles to a single binary without external dependencies, which is very easy to install.

First of all, let's create a folder for the exporter and switch directory.


mkdir /opt/nginx-exporter
cd /opt/nginx-exporter
As a best practice, you should always create a dedicated user for each application that you want to run. Let's call it an nginx-exporter user and a group.


sudo useradd --system --no-create-home --shell /bin/false nginx-exporter
From the releases pages on GitHub, let's find the latest version and copy the link to the appropriate archive. In my case, it's a standard amd64 platform.

Image title

We can use curl to download the exporter on the Ubuntu machine.


curl -L https://github.com/nginxinc/nginx-prometheus-exporter/releases/download/v0.11.0/nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz -o nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
Extract the prometheus exporter from the archive.


tar -zxf nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
You can also remove it to save some space.


rm nginx-prometheus-exporter_0.11.0_linux_amd64.tar.gz
Let's make sure that we downloaded the correct binary by checking the version of the exporter.


./nginx-prometheus-exporter --version
It's optional; let's update the ownership on the exporter folder.


chown -R nginx-exporter:nginx-exporter /opt/nginx-exporter
To run it, let's also create a systemd service file. In case it exits systemd manager can restart it. It's the standard way to run Linux daemons.


vim /etc/systemd/system/nginx-exporter.service
Make sure you update the scrape-uri to the one you used in Nginx to expose basic metrics. Also, update the Linux user and the group to match yours in case you used different names.

nginx-exporter.service

[Unit]
Description=Nginx Exporter
Wants=network-online.target
After=network-online.target

StartLimitIntervalSec=0

[Service]
User=nginx-exporter
Group=nginx-exporter
Type=simple
Restart=on-failure
RestartSec=5s

ExecStart=/opt/nginx-exporter/nginx-prometheus-exporter \
    -nginx.scrape-uri=http://localhost:8080/status

[Install]
WantedBy=multi-user.target
Enable the service to automatically start the daemon on Linux restart.


systemctl enable nginx-exporter
Then start the nginx prometheus exporter.


systemctl start nginx-exporter
Check the status of the service.


systemctl status nginx-exporter
If your exporter fails to start, you can check logs to find the error message.


journalctl -u nginx-exporter -f --no-pager
To verify that Prometheus exporter can access nginx and properly scrape metrics, use curl command and default 9113 port for the exporter.


curl localhost:9113/metrics
Now you should be able to get the same metrics from the status page but in Prometheus format.

nginx_up 1
Install Prometheus
Now let's quickly install the latest version of prometheus on the same host.

Create a dedicated Linux user for Prometehus.


sudo useradd --system --no-create-home --shell /bin/false prometheus
Let's check the latest version of Prometheus from the download page.

You can use the curl or wget command to download Prometheus.


curl -L https://github.com/prometheus/prometheus/releases/download/v2.41.0/prometheus-2.41.0.linux-amd64.tar.gz -o prometheus-2.41.0.linux-amd64.tar.gz
Then, we need to extract all Prometheus files from the archive.


tar -xvf prometheus-2.41.0.linux-amd64.tar.gz
Usually, you would have a disk mounted to the data directory. For this tutorial, I will simply create a /data director. Also, you need a folder for Prometheus configuration files.


mkdir -p /data /etc/prometheus
Now, let's change the directory to Prometheus and move some files.


cd prometheus-2.41.0.linux-amd64
First of all, let's move the prometheus binary and a promtool to the /usr/local/bin/. promtool is used to check configuration files and Prometheus rules.


mv prometheus promtool /usr/local/bin/
Optionally, we can move console libraries to the Prometheus configuration directory. Console templates allow for the creation of arbitrary consoles using the Go templating language. You don't need to worry about it if you're just getting started.


mv consoles/ console_libraries/ /etc/prometheus/
Finally, let's move the example of the main prometheus configuration file.


mv prometheus.yml /etc/prometheus/prometheus.yml
To avoid permission issues, you need to set correct ownership for the /etc/prometheus/ and /data directory.


chown -R prometheus:prometheus /etc/prometheus/ /data/
Optionally you can clean up and delete the archive itself and unused files.

Verify that you can execute the Prometheus binary by running the following command:


prometheus --version
We're going to use systemd, which is a system and service manager for Linux operating systems. For that, we need to create a systemd unit configuration file.


vim /etc/systemd/system/prometheus.service
Make sure you're using the correct username and group. Also, check the data path.

prometheus.service

[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

StartLimitIntervalSec=0

[Service]
User=prometheus
Group=prometheus
Type=simple
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/data \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.listen-address=0.0.0.0:9090 \
  --web.enable-lifecycle

[Install]
WantedBy=multi-user.target
Before we launch Prometheus, let's add our Nginx Prometheus Exporter as a target.


vim /etc/prometheus/prometheus.yml
Update the job name to nginx-prometheus-exporter and port to 9113.

/etc/prometheus/prometheus.yml

scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: "nginx-prometheus-exporter"

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ["localhost:9113"]
To automatically start the Prometheus after reboot, run enable.


systemctl enable prometheus
Then just start the Prometheus.


systemctl start prometheus
To check the status of Prometheus run following command:


systemctl status prometheus
Now you can go to http://<ip>:9090/ to check if the prometheus is working.

Under the targets section, you should have a single nginx-prometheus-exporter target.

Image title

Now, you can query your metrics from the Prometheus explorer tab. For example, you can use nginx_connections_active to get active nginx connections.

Image title

Install Grafana¶
The next step is to install Grafana, which is much simpler since we can use official repository.

First, let's make sure that all the dependencies are installed.


apt install -y apt-transport-https software-properties-common
Next, add GPG key.


wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
Add this repository for stable releases.


echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
After you add the repository, update and install Garafana.


apt update
apt -y install grafana
To automatically start the Grafana after reboot, enable the service.


systemctl enable grafana-server
Then start the Grafana.


systemctl start grafana-server
To check the status of Grafana, run the following command


systemctl status grafana-server
Now you can access Grafana on port http://<ip>:3000. The username is admin, and the password is admin as well.

First of all, let's add our Prometheus as a datasource.
For the URL, use http://localhost:9090 and click save and test.
Let's create a new dashboard and call it Nginx.
Create a new Panel.
For the metrics use nginx_connections_active.
For the legend {{ instance }}.
Title: Active Connections.
I'm going to fill out the rest of the panels using the metrics that we retried from the status page. You can find this dashboard in my github repository.

On the left-hand side, we have all the gauges, and on the right-hand side, all the counters. To make use of the counter, you need to apply a rate function, for example, to calculate a number of requests per second.

Install Fluentd¶
The next step is to install Fluentd and convert Nginx logs to Prometheus metrics.

First of all, we need to install the ruby programming language.


apt install build-essential ruby-dev
Verify that ruby is installed successfully. You need at least a 2.7 ruby version.


ruby --version
Now we can install the fluentd itself using gem, which is a standard way for ruby to distribute packages.


gem install fluentd --no-doc
Install the fluentd plugin to convert logs to prometheus metrics.


gem install fluent-plugin-prometheus
Verify fluentd installation. You should get the latest version.


fluentd --version
Create a folder to place Fluentd Config.


mkdir /etc/fluent/
Let's update the Nginx access log to emit additional values.


vim /etc/nginx/nginx.conf
Add upstream_response_time at the end of the log. But better replace the whole string with mine to avoid any typos.

/etc/nginx/nginx.conf

    log_format custom '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" '
    '$upstream_response_time';

    access_log /var/log/nginx/access.log custom;
Let's save and restart Nginx.


nginx -t
systemctl restart nginx
Now we need to create a regular expression to parse nginx access logs. First, let's get a sample from the log and use one of the online regex editors.


tail -f /var/log/nginx/access.log
Since we don't have any upstream services, the last value is empty for now.
Here we have the old logs; let's invoke one of the Nginx endpoints.


127.0.0.1 - - [22/Dec/2022:20:13:11 +0000] "GET /status HTTP/1.1" 200 98 "-" "NGINX-Prometheus-Exporter/v0.11.0" -
Let's use regex101com to create the regular expression.


^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \[(?<time>[^\]]*)\] \"(?<method>\w+)(?:\s+(?<path>[^\"]*?)(?:\s+\S*)?)?\" (?<status_code>[^ ]*) (?<size>[^ ]*)(?:\s"(?<referer>[^\"]*)") "(?<agent>[^\"]*)" (?<urt>[^ ]*)$
Paste your log sample and enter the regular expression. On the right-hand side, you'll see the named parameters, such as status code, method, size, and others. All of them we will be able to convert to prometheus and use them as labels.

Image title

Now let's create the Fluentd config.


vim /etc/fluent/fluent.conf
You'll find the metric sections where we convert logs to prometheus metrics. For example, to measure latency, we use nginx_upstream_time_seconds_hist.


<source>
    @type prometheus_tail_monitor
</source>

<source>
  @type prometheus
</source>

<source>
    @type tail
    <parse>
    @type regexp
    expression /^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \[(?<time>[^\]]*)\] \"(?<method>\w+)(?:\s+(?<path>[^\"]*?)(?:\s+\S*)?)?\" (?<status_code>[^ ]*) (?<size>[^ ]*)(?:\s"(?<referer>[^\"]*)") "(?<agent>[^\"]*)" (?<urt>[^ ]*)$/
        time_format %d/%b/%Y:%H:%M:%S %z
        keep_time_key true
        types size:integer,reqtime:float,uct:float,uht:float,urt:float
    </parse>
    tag nginx
    path /var/log/nginx/access.log
    pos_file /tmp/fluent_nginx.pos
</source>
<filter nginx>
    @type prometheus

  <metric>
    name nginx_size_bytes_total
    type counter
    desc nginx bytes sent
    key size
  </metric>

  <metric>
    name nginx_request_status_code_total
    type counter
    desc nginx request status code
    <labels>
      method ${method}
      path ${path}
      status_code ${status_code}
    </labels>
  </metric>

  <metric>
    name nginx_http_request_duration_seconds
    type histogram
    desc Histogram of the total time spent on receiving the response from the upstream server.
    key urt
    <labels>
      method ${method}
      path ${path}
      status_code ${status_code}
    </labels>
  </metric>

</filter>
Create the last systemd service unit for fluentd to run it in the background. Let's run it as a root to grant access to Nginx logs. Of course, I would advise you to downgrade it to its own user.


vim /etc/systemd/system/fluentd.service
fluentd.service

[Unit]
Description=Fluentd
Wants=network-online.target
After=network-online.target

StartLimitIntervalSec=0

[Service]
User=root
Group=root
Type=simple
Restart=on-failure
RestartSec=5s
ExecStart=fluentd --config /etc/fluent/fluent.conf

[Install]
WantedBy=multi-user.target
As always, enable, start and check the status.


systemctl enable fluentd
systemctl start fluentd
systemctl status fluentd
You can access Prometheus metrics on localhost:24231/metrics.


curl http://localhost:24231/metrics
Let's add another Prometheus target to scrape fluentd.


vim /etc/prometheus/prometheus.yml
/etc/prometheus/prometheus.yml

  - job_name: "nginx-fluentd"
    static_configs:
      - targets: ["localhost:24231"]
Restart Prometheus.


systemctl restart prometheus
Now you should have 2 targets in the Prometheus UI.

Create Simple Flask App¶
For the final test, let's create a simple Flask app to test our metrics.

Install the pip package manager for python if you don't have it yet.


apt install python3-pip
Install Flask, which is an http framework for Python.


pip install flask
Install gunicorn, which is a production-grade server for flask applications.


pip install gunicorn
Create a folder for the app.


mkdir /opt/myapp
Now let's create the app itself.


vim /opt/myapp/app.py
It's a very simple HTTP api that has a single /api/devices endpoint and supports get and post methods. Also, we simulate a load by generating the random sleep interval.

/opt/myapp/app.py

import random
import time
from flask import Flask, request


app = Flask(__name__)

devices = [{
    "id": 1,
    "mac": "14-BA-17-74-24-1D",
    "firmware": "2.0.6"
}, {
    "id": 1,
    "mac": "14-BA-17-74-24-1D",
    "firmware": "2.0.6"
}]


@app.route("/api/devices", methods=['GET', 'POST'])
def hello_world():
    sleep()
    if request.method == 'POST':
        return {'message': 'Device created!'}, 201
    else:
        return devices, 200


def sleep():
    time.sleep(random.randint(0, 5) * 0.1)
Create a dedicated user for the flask app.


sudo useradd --system --no-create-home --shell /bin/false myapp
Update ownership on the folder.


chown -R myapp:myapp /opt/myapp
Create the systemd service for the app.


vim /etc/systemd/system/myapp.service
fluentd.service

[Unit]
Description=My App
Wants=network-online.target
After=network-online.target

StartLimitIntervalSec=500
StartLimitBurst=5

[Service]
User=myapp
Group=myapp
Type=simple
Restart=on-failure
RestartSec=5s

WorkingDirectory=/opt/myapp
ExecStart=/usr/local/bin/gunicorn -w 4 'app:app' --bind 127.0.0.1:8282

[Install]
WantedBy=multi-user.target
Enable, start and check the app.


systemctl enable myapp
systemctl start myapp
systemctl status myapp
Now, check if you can access the flask app locally.


curl -i localhost:8282/api/devices
The next step is to use Nginx as a reverse proxy for our app.


vim /etc/nginx/conf.d/myapp.conf
Let's also add a few headers just in case the flask needs to know where the request is coming from.

/etc/nginx/conf.d/myapp.conf

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8282/;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /;
    }
}
Remove the default Nginx config with hello world page.


rm /etc/nginx/conf.d/default.conf
Test and reload Nginx config.


nginx -t
systemctl reload nginx
Now we can use the Nginx ip address to test the app. http://<ip>/api/devices

Finally, let's create a few more Grafana dashboards to use these metrics.
