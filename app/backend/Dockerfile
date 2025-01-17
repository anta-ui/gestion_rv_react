FROM python:3.10

# Définir le répertoire de travail
WORKDIR /usr/src/app/backend

# Installer les dépendances système pour mysqlclient
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements.txt
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir --default-timeout=100 -r requirements.txt

# Copier le reste du code
COPY . .

# Port à exposer
EXPOSE 8000
