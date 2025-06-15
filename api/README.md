# Express MongoDB Challenge App

This project is an Express.js application that utilizes MongoDB to manage challenges, submissions, users, and badges. It provides a RESTful API for creating, retrieving, updating, and deleting records related to these entities.

## Project Structure

```
express-mongodb-challenge-app
├── src
│   ├── controllers
│   │   ├── badgeController.js
│   │   ├── challengeController.js
│   │   ├── submissionController.js
│   │   └── userController.js
│   ├── models
│   │   ├── Badge.js
│   │   ├── Challenge.js
│   │   ├── Submission.js
│   │   └── User.js
│   ├── routes
│   │   ├── badgeRoutes.js
│   │   ├── challengeRoutes.js
│   │   ├── submissionRoutes.js
│   │   └── userRoutes.js
│   ├── app.js
│   └── config
│       └── db.js
├── package.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd express-mongodb-challenge-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Configuration

Before running the application, ensure that you have a MongoDB database set up. Update the database connection settings in `src/config/db.js` as needed.

## Usage

To start the application, run:
```
npm start
```

The server will start on the specified port (default is 3000). You can access the API endpoints as defined in the routes.

## API Endpoints

- **Challenges**
  - Create, retrieve, update, and delete challenges.
  
- **Submissions**
  - Create, retrieve, update, and delete submissions.
  
- **Users**
  - Create, retrieve, update, and delete user records.
  
- **Badges**
  - Create, retrieve, update, and delete badge records.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.