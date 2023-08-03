# playwright doesnt support debian image
FROM ubuntu:focal

run apt-get update && apt-get install wget xz-utils -y

RUN mkdir /data

WORKDIR /data

RUN wget https://nodejs.org/dist/v20.5.0/node-v20.5.0-linux-x64.tar.xz -O nodejs.tar.xz \
  && mkdir /opt/nodejs \
  && tar -xf nodejs.tar.xz --strip-components 1 -C /opt/nodejs \
  && rm nodejs.tar.xz
ENV PATH="$PATH:/opt/nodejs/bin"
RUN npm install -g yarn

COPY ./package.json ./yarn.lock ./playwright.config.ts .

RUN yarn
RUN npx playwright install-deps

COPY . .

RUN yarn prisma generate
RUN yarn build

CMD yarn prisma migrate deploy && yarn start
