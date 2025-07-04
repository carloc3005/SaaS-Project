# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Set the final working directory where the app will live
WORKDIR /home/user

# Create Next.js app and install shadcn components directly in the working directory.
# This is more efficient and avoids the slow 'mv' command.
RUN npx --yes create-next-app@15.3.3 . --yes && \
    npx --yes shadcn@2.6.3 init --yes -b neutral --force && \
    npx --yes shadcn@2.6.3 add --all --yes