# Build context: ./Roundtable
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files first for better layer caching
COPY ["src/Roundtable.Domain/Roundtable.Domain.csproj", "Roundtable.Domain/"]
COPY ["src/Roundtable.Application/Roundtable.Application.csproj", "Roundtable.Application/"]
COPY ["src/Roundtable.Infrastructure/Roundtable.Infrastructure.csproj", "Roundtable.Infrastructure/"]
COPY ["src/Roundtable.Backend/Roundtable.Backend.csproj", "Roundtable.Backend/"]
RUN dotnet restore "Roundtable.Backend/Roundtable.Backend.csproj"

# Copy rest of source and build
COPY ["src/Roundtable.Domain/", "Roundtable.Domain/"]
COPY ["src/Roundtable.Application/", "Roundtable.Application/"]
COPY ["src/Roundtable.Infrastructure/", "Roundtable.Infrastructure/"]
COPY ["src/Roundtable.Backend/", "Roundtable.Backend/"]
WORKDIR /src/Roundtable.Backend
RUN dotnet build "Roundtable.Backend.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Roundtable.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5001

# Persist SQLite DB in /data (mounted volume in compose)
ENV ConnectionStrings__DefaultConnection="Data Source=/data/roundtable.db"
# Avoid ASPNETCORE_URLS overriding base image port env (removes "Overriding HTTP_PORTS" warning)
ENV ASPNETCORE_HTTP_PORTS=5001
ENV ASPNETCORE_HTTPS_PORTS=

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Roundtable.Backend.dll"]
