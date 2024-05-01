# Start your image with a node base image
FROM node:lts-alpine

# The /app directory should act as the main application directory
WORKDIR /beer-passport-server

# Copy the app package and package-lock.json file
COPY package*.json ./
COPY tsconfig.json ./
COPY context.ts ./
COPY .babelrc ./
COPY .env ./
COPY client.ts ./
COPY singleton.ts ./

# Copy local directories to the current local directory of our docker image (/app)
COPY ./src ./src
COPY ./prisma ./prisma
COPY ./data ./data

# Install node packages, install serve, build the app, and remove dependencies at the end
RUN npm install\
    && npm run build:prod

EXPOSE 3000

# Start the app
CMD [ "npm", "run", "start:prod" ]