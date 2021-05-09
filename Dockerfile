FROM node:14

# Create app directory
# RUN mkdir -p /opt/default-backend
WORKDIR /opt/default-backend

# copy project to container
COPY . .

ENV DATABASE_URL "postgresql://default_db_user:default_db_password@db:5432/default_db?schema=public"
ENV NODE_ENV "development"
ENV PORT 8000


