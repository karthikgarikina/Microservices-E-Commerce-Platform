FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
COPY tests ./tests
EXPOSE 3003
CMD ["npm","start"]
