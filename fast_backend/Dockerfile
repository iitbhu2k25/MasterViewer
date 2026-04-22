FROM python:3.12-slim


ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/home/app
ENV WBT_PATH=/opt/whitebox


RUN echo "deb http://deb.debian.org/debian bookworm contrib" >> /etc/apt/sources.list


RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections


RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libproj-dev \
    libpq-dev \
    binutils \
    gcc \
    build-essential \
    curl \
    wget \
    unzip \
    fontconfig \
    ttf-mscorefonts-installer \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

# GDAL environment
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal
ENV GDAL_CONFIG=/usr/bin/gdal-config


RUN wget -P /tmp https://www.whiteboxgeo.com/WBT_Linux/WhiteboxTools_linux_amd64.zip \
    && unzip /tmp/WhiteboxTools_linux_amd64.zip -d /tmp \
    && mv /tmp/WhiteboxTools_linux_amd64/WBT /opt/whitebox \
    && chmod +x /opt/whitebox/whitebox_tools \
    && rm -rf /tmp/WhiteboxTools_linux_amd64.zip /tmp/WhiteboxTools_linux_amd64


WORKDIR /home/app

# Upgrade pip
RUN python -m pip install --upgrade pip setuptools wheel


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


RUN useradd -m appuser \
    && chown -R appuser:appuser /home/app \
    && chown -R appuser:appuser /opt/whitebox

USER appuser

COPY . .

EXPOSE 7000