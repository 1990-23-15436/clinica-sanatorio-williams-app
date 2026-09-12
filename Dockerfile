# Etapa 1: Construcción (Node)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copiamos la configuración (si tienes una)
COPY nginx.conf /etc/nginx/conf.d/default.conf 

# Copiamos lo que construyó la Etapa 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
