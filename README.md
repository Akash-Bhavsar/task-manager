
# Task Manager

  

A simple and efficient task management application to help you organize your work and boost productivity.

  

## Technology Stack

  

### Frontend (Client):

-  **Framework**: Next.js (React-based framework), Typescript

-  **Styling**: Tailwind CSS for utility-first styling

-  **State Management**: Context API for authentication and user state

-  **Icons**: React Icons for UI elements

  

### Backend (Server):

-  **Framework**: Node.js with Express.js, Typescript

-  **Database**: PostgreSQL with Prisma ORM for type-safe queries

-  **Authentication**: JWT (JSON Web Token) for secure authentication

-  **Logging**: Winston for structured logging

-  **Testing**: Vitest and Supertest for integration tests

  

## Features

  

### Client Features:

-  **User Authentication**: Login and signup functionality with JWT-based authentication.

-  **Task Management**: Create, update, delete, and view tasks.

-  **Responsive Design**: Fully responsive UI for desktop and mobile devices.

-  **Dashboard**: Filter, search, and paginate tasks.

-  **Error Handling**: Toast notifications for errors and success messages.

  

### Server Features:

-  **User Management**: Register, login, update, and delete users.

-  **Task Management**: CRUD operations for tasks with role-based access control.

-  **Role-Based Access Control**: Admin users can manage all tasks, while regular users can only manage their own.

-  **Logging**: Detailed logs for debugging and monitoring.

-  **Testing**: Comprehensive integration tests for API endpoints.

  

## Installation

  

### Prerequisites:

- Node.js (v16 or higher)

- PostgreSQL database

  

### Steps:

  

1. Clone the repository:

  

```bash

git  clone  https://github.com/akash-bhavsar/task-manager.git

```

  

2. Navigate to the project directory:

  

```bash

cd  task-manager

```

  

3. Install dependencies for both client and server:

  

```bash

# Install server dependencies
cd  server
npm  install

# Install client dependencies
cd  ../client
npm  install

```

  

4. Configure environment variables:

  

Create a `.env` file in the `server` directory with the following content:

  

```
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
JWT_SECRET=your_jwt_secret
PORT=3000
env_type=<development/production>

```

  

5. Set up the database:

  

Run Prisma migrations to create the database tables:

  

```bash

npx  prisma  migrate  dev  --name  init

```

6. Start the development servers:

```bash

# Start the server
cd  server
npm  run  dev

# Start the client
cd  ../client
npm  run  dev

```

  

The client will run on `http://localhost:3000` and the server on `http://localhost:3001` (or as configured).

  

## Testing

  

Run integration tests for the server:

  

```bash

cd  server
npm  test

```

  

### Test Cases

  

#### User Endpoints:

1.  **Register a new user**: Verifies that a new user can be registered successfully.

2.  **Login user and receive cookie**: Ensures that a user can log in and receive a valid session cookie.

3.  **List users (requires authentication)**: Tests that authenticated users can retrieve a list of users.

4.  **Update user profile**: Confirms that a user can update their profile information.

  

#### Task Endpoints:

1.  **Create a new task**: Validates that a new task can be created successfully.

2.  **Get my tasks**: Ensures that users can retrieve their own tasks.

3.  **Update the task**: Verifies that a task can be updated with new details.

4.  **Delete the task**: Confirms that a task can be deleted successfully.

  

## API Endpoints

  

### User Endpoints:

-  `POST /api/users/register` -> Register a new user.

-  `POST /api/users/login` -> Login and receive a JWT token.

-  `GET /api/users/users` -> List all users (authentication required).

-  `PUT /api/users/:id` -> Update a user's profile (authentication required; users can only update their own profile).

-  `DELETE /api/users/:id` -> Delete a user (authentication required).

  

### Task Endpoints:

-  `GET /api/tasks/my-tasks` -> Get tasks for the authenticated user.

-  `GET /api/tasks` -> Get all tasks (ADMIN only; non-admin users see only their tasks).

-  `POST /api/tasks` -> Create a new task.

-  `PUT /api/tasks/:id` -> Update an existing task.

-  `DELETE /api/tasks/:id` -> Delete a task.

  

## Folder Structure

  

The project is organized as follows:

  

### Root Directory:

-  **README.md**: Documentation for the project.

-  **client/**: Contains the frontend code built with Next.js.

-  **server/**: Contains the backend code built with Node.js and Express.

-  **logs/**: Stores log files for debugging and monitoring.

  

### Client Directory:

-  **eslint.config.mjs**: ESLint configuration for linting the code.

-  **next-env.d.ts**: TypeScript environment configuration for Next.js.

-  **next.config.ts**: Next.js configuration file.

-  **package.json**: Lists dependencies and scripts for the client.

-  **postcss.config.mjs**: Configuration for PostCSS.

-  **tailwind.config.js**: Configuration for Tailwind CSS.

-  **tsconfig.json**: TypeScript configuration file.

-  **app/**: Contains the main application code.

-  **globals.css**: Global CSS styles.

-  **layout.tsx**: Layout component for the application.

-  **page.tsx**: Main page component.

-  **components/**: Reusable UI components (e.g., `Errorpopup.tsx`, `Task.tsx`).

-  **dashboard/**: Contains the dashboard page.

-  **layouts/**: Layout components like `AuthProvider.tsx`, `Footers.tsx`, and `Headers.tsx`.

-  **login/**: Login page.

-  **signup/**: Signup page.

-  **lib/**: Contains utility functions and API calls.

-  **api/**: API functions for authentication (`auth.ts`) and tasks (`tasks.ts`).

-  **public/**: Public assets like images and icons.

  

### Server Directory:

-  **app.ts**: Main application file for Express.

-  **index.ts**: Entry point for the server.

-  **Node API.postman_collection.json**: Postman collection for testing APIs.

-  **package.json**: Lists dependencies and scripts for the server.

-  **tsconfig.json**: TypeScript configuration file.

-  **middlewares/**: Middleware functions (e.g., `authenticateToken.ts`).

-  **prisma/**: Contains the Prisma schema (`schema.prisma`).

-  **routes/**: API route handlers for tasks (`tasks.ts`) and users (`users.ts`).

-  **tests/**: Contains test files (e.g., `api.test.ts`).

-  **utils/**: Utility functions (e.g., `logger.ts`).

  

### Logs Directory:

-  **combined.log**: Combined log file for all logs.

-  **error.log**: Log file for errors.

  

## Application Screenshots

  

### User Interface

1.  **Homepage**:

![Homepage](/public/Homepage.webp)

  

2.  **Dashboard**:

![Dashboard](/public/Dashboard.webp)

  

3.  **Login Page**:

![Login Page](/public/LoginPage.webp)

  

4.  **Signup Page**:

![Signup Page](/public/SignupPage.webp)

  

### Task Management

5.  **Create Task**:

![Create Task](/public/CreateTask.webp)

  

6.  **Edit Task**:

![Edit Task](/public/EditTask.webp)

  

7.  **Filters**:

![Filters](/public/Filters.webp)

  

## Contributing

  

1. Fork the repository

2. Create your feature branch (`git checkout -b feature/amazing-feature`)

3. Commit your changes (`git commit -m 'Add some amazing feature'`)

4. Push to the branch (`git push origin feature/amazing-feature`)

5. Open a Pull Request

  

## License

  

This project is licensed under the MIT License - see the LICENSE file for details.
