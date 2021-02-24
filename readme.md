# Launch


> Step 1. Install docker and git our server

https://docs.docker.com/install/<br>
https://git-scm.com/downloads


> Step 2.

```
git clone https://github.com/garik-code/backend.git
```


> Step 3. PostgreSQL Database directory appears to contain a database; Skipping initialization:

```
cd backend/postgres
mkdir -p pg_commit_ts
mkdir -p pg_dynshmem
mkdir -p pg_logical/mappings
mkdir -p pg_logical/snapshots
mkdir -p pg_replslot
mkdir -p pg_serial
mkdir -p pg_snapshots
mkdir -p pg_stat
mkdir -p pg_tblspc
mkdir -p pg_twophase
```

> Step 4. edit full path

```
cd .././
nano docker-compose.yml

```

> Step 5. edit config SMS_RU, SENDGRID_API_KEY, crypto exchange

```
cd /backend/nodejs
nano .env

```


> Step 6. Start project

```
docker-compose build --no-cache
docker-compose up -d

```


# Usage

Frontend (nginx) - <a href="http://localhost:8080/" target="_blank">http://< Your ip address >:8080/</a><br>
Postgres database admin (PgAdmin4) - <a href="http://localhost:5050/" target="_blank">http://< Your ip address >:5050/</a><br>
Api (nodejs) - <a href="http://localhost:228/" target="_blank">http://< Your ip address >:228/</a><br>
