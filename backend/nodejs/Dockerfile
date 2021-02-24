FROM keymetrics/pm2:12-alpine

# Bundle APP files
WORKDIR /usr/src/app
COPY package*.json ./
COPY ecosystem.config.js .
COPY . .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production

# Expose the listening port of your app
EXPOSE 228

# Show current folder structure in logs
RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
