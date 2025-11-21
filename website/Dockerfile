FROM nginx:alpine

# Copy website files to Nginx html directory
COPY src/ /usr/share/nginx/html/

# Copy custom Nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
