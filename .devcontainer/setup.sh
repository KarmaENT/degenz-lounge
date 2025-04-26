#!/bin/sh

# Update and install base system dependencies
apk update && apk upgrade
apk add --no-cache \
    # Core dev tools
    git curl wget bash zsh fish sudo nano vim \
    # Build essentials
    build-base cmake python3 python3-dev py3-pip \
    # Node.js stack
    nodejs npm yarn \
    # Database clients
    postgresql-client mysql-client sqlite \
    # Security/Networking
    openssl openssh-client ca-certificates \
    # Container tools
    docker docker-compose \
    # Performance monitoring
    htop iftop ncdu

# Optional: Zsh as default shell (with oh-my-zsh)
apk add zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
sed -i -e "s/bin\/ash/bin\/zsh/" /etc/passwd

# Install global Node.js packages
npm install -g \
    typescript \
    prisma \
    nodemon \
    eslint \
    prettier \
    yarn \
    pnpm \
    @nestjs/cli \
    serve

# Configure Git (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global core.autocrlf input
git config --global init.defaultBranch main

# Create non-root user (codespace convention)
adduser -D -s /bin/zsh vscode
echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Cleanup to minimize image size
rm -rf /var/cache/apk/* /tmp/*
