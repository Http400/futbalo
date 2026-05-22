# How it will be deployed

I want to create docker files for web-app, admin-app and auth-service.
I want to create a docker compose file which will be used for deployment (it should include postgreSQL and pgadmin).
I want a single nginx.conf. Here I have an example of it used in another repo:
```
events {
	worker_connections 1024;
}

http {
	include mime.types;

	map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

	server {
		listen 443 ssl;
		server_name www.futbalo.eu;
		ssl_certificate /etc/nginx/certs/fullchain.pem;
		ssl_certificate_key /etc/nginx/certs/privkey.pem;
		root /apps/web-app;
		location / {
			try_files $uri /index.html =404;
		}
	}

	server {
		listen 443 ssl;
		server_name api.futbalo.eu;
		ssl_certificate /etc/nginx/certs/fullchain.pem;
		ssl_certificate_key /etc/nginx/certs/privkey.pem;
		
		location /hub-manager {
			proxy_pass http://hub-manager:3000/api;

			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
			proxy_set_header X-Forwarded-Proto $scheme;

			proxy_set_header Authorization $http_authorization;
		}

		location /iot-data-hub {
			proxy_pass http://iot-data-hub:3000/api;

			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
			proxy_set_header X-Forwarded-Proto $scheme;

			proxy_set_header Authorization $http_authorization;
		}

		location /iot-data-hub/ws {
            proxy_pass http://iot-data-hub:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
			proxy_read_timeout 120;
			proxy_send_timeout 120;
			proxy_connect_timeout 120;

			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
	}

	server {
		listen 443 ssl;
		server_name pgadmin.futbalo.eu;
		ssl_certificate /etc/nginx/certs/fullchain.pem;
		ssl_certificate_key /etc/nginx/certs/privkey.pem;
		location / {
			proxy_pass http://pgadmin:80;
		}
	}

	server {
		listen 80;
		server_name *.futbalo.eu;
		return 301 https://$host$request_uri;
	}
}
```

In the above example there is an ssl but for now let's omit this. We'll add this in the next step.
And the domain is futbalo as in the example.