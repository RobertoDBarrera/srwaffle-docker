# 1. Usar la imagen ligera oficial de Node.js Alpine
FROM node:20-alpine

# 2. Configurar el directorio de trabajo del contenedor
WORKDIR /usr/src/app

# 3. Copiar los archivos de definición de dependencias
COPY package*.json ./

# 4. Instalar únicamente las dependencias de producción para mantener la imagen liviana
RUN npm ci --only=production

# 5. Copiar todo el código de la aplicación (excluyendo lo declarado en .dockerignore)
COPY . .

# 6. Exponer el puerto configurado (el servidor Express escucha en el 3000 por defecto)
EXPOSE 3000

# 7. Declarar variables de entorno de producción por defecto
ENV NODE_ENV=production
ENV PORT=3000

# 8. Comando para iniciar la aplicación
CMD ["node", "server.js"]
