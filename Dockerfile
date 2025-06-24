FROM nginx
COPY nginx.base.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/nginx.conf.d/default.conf
COPY dist /usr/share/nginx/html
