FROM node:20-alpine
RUN npm install -g pnpm                                                                                                   
WORKDIR /app                                                                                  
COPY order-service/package.json order-service/pnpm-lock.yaml ./                                                                                          
RUN pnpm install                                                                                                              
COPY order-service/ .                                                                                                                    
COPY proto/ /proto
RUN pnpm build
CMD ["node", "dist/main.js"]
