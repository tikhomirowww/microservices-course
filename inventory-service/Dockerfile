FROM node:20-alpine                                                                                                                        
RUN npm install -g pnpm
WORKDIR /app
COPY inventory-service/package.json inventory-service/pnpm-lock.yaml ./
RUN pnpm install
COPY inventory-service/ .                                                                                                                     
COPY proto/ /proto
RUN pnpm build                                                                                                                        
CMD ["node", "dist/main.js"]                 
