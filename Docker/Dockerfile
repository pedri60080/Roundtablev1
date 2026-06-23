# Stage 1: build Angular frontend
FROM node:22-alpine AS frontend-build
ARG APP_VERSION=__DEPLOY_VERSION__
WORKDIR /app
COPY src/Roundtable.Frontend/package.json src/Roundtable.Frontend/package-lock.json ./
RUN npm ci
COPY src/Roundtable.Frontend/ ./
RUN npm run build

# Stage 2: publish ASP.NET API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
COPY src/ ./src/
COPY Roundtable.sln ./
RUN dotnet publish src/Roundtable.Backend/Roundtable.Backend.csproj -c Release -o /app/publish

# Stage 3: runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist/roundtable-frontend/browser ./wwwroot
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "Roundtable.Backend.dll"]
