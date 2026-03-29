## Backend Express MVC

### Structure
- src/config: DB connection and env config
- src/models: Data models (Mongo)
- src/services: Business/data access logic
- src/controllers: Request handlers
- src/routes: API routes
- src/middlewares: Error handlers
- scripts: Seed scripts

### Install
1. `npm install`
2. `npm install --prefix server`
3. `npm install --prefix client`

### Run
- Backend only: `npm run dev:server`
- Frontend only: `npm run dev:client`
- Run both: `npm run dev`

### API Prefix
- `/api/health`
- `/api/mongo/hotels`
- `/api/mongo/reviews`
- `/api/mysql/bookings`
