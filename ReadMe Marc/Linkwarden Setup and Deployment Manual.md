#  Linkwarden Setup and Deployment Manual Marc

#### Prerequisites
- Docker
- Docker Compose
- Text editor or IDE (e.g., Visual Studio Code, PyCharm)

#### Step 1: Clone the Repository
Clone the Linkwarden repository from GitHub:
```sh
git clone https://github.com/mostrub/linkwarden.git
cd linkwarden
```

#### Step 2: Copy and Edit the Environment File
Copy the example environment file and edit it with your specific configuration:
1. Run the following command to copy the `.env.example` file to `.env`:
    ```sh
    cp .env.example .env
    ```

2. Open the `.env` file in your text editor (e.g., Visual Studio Code, PyCharm):
    ```sh
    code .env  # For Visual Studio Code
    # or
    pycharm .env  # For PyCharm
    ```

3. Update the environment variables with your specific configuration:
    ```sh
    POSTGRES_USER=mostrub@gmail.com
    POSTGRES_PASSWORD=9u823inmlaskmn.l,jkasndfolif
    POSTGRES_DB=linkwarden
    DATABASE_URL=postgresql://mostrub@gmail.com:9u823inmlaskmn.l,jkasndfolif@postgres:5432/linkwarden
    ```

#### Step 3: Review Docker Configuration Files
##### Dockerfile
The `Dockerfile` defines the steps to build a Docker image for Linkwarden:
```Dockerfile
FROM node:18.18-bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir /data

WORKDIR /data

COPY ./package.json ./yarn.lock ./playwright.config.ts ./

RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn yarn install --network-timeout 10000000

RUN apt-get update

RUN apt-get install -y \
    build-essential \
    curl \
    libssl-dev \
    pkg-config

RUN apt-get update

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

RUN cargo install monolith

RUN npx playwright install-deps && \
    apt-get clean && \
    yarn cache clean

RUN yarn playwright install

COPY . .

RUN yarn prisma generate && \
    yarn build

CMD yarn prisma migrate deploy && yarn start
```

##### docker-compose.yml
The `docker-compose.yml` file defines the services for running Linkwarden with Docker Compose:
```yaml
version: "3.5"
services:
  postgres:
    image: postgres:16-alpine
    env_file: .env
    restart: always
    volumes:
      - ./pgdata:/var/lib/postgresql/data
  linkwarden:
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres
    restart: always
    # build: . # uncomment this line to build from source
    image: ghcr.io/linkwarden/linkwarden:latest # comment this line to build from source
    ports:
      - 3000:3000
    volumes:
      - ./data:/data/data
    depends_on:
      - postgres
```

#### Step 4: Build and Run the Docker Containers
1. Ensure Docker and Docker Compose are installed on your system.
2. Run Docker Compose to build and run the Linkwarden container along with a PostgreSQL database container:
    ```sh
    docker-compose up -d
    ```

#### Step 5: Access Linkwarden
Once the containers are running, you can access Linkwarden in your web browser at `http://localhost:3000`.

#### Additional Resources
- [Linkwarden Documentation](https://docs.linkwarden.app)
- [Linkwarden GitHub Repository](https://github.com/mostrub/linkwarden)

This manual should guide you through the setup and deployment of Linkwarden using Docker. If you encounter any issues, refer to the documentation or seek support from the Linkwarden community.