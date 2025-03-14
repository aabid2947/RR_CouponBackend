# Coupon Distribution Backend

A Node.js Express backend for handling coupon distribution with eligibility checks, claiming, and round-robin allocation.

## Features
- Provides a list of available coupons.
- Checks user eligibility before claiming a coupon.
- Implements a cooldown period to prevent frequent claims.
- Uses a round-robin mechanism for fair coupon distribution.

## Setup Instructions

### 1. Clone the Repository
```sh
git clone https://github.com/your-repo/coupon-backend.git
cd coupon-backend
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and specify the required variables:
```
PORT=3000
```

### 4. Start the Server
```sh
npm start
```

The server will run at `http://localhost:3000`.

## API Endpoints

### `GET /coupons`
- Returns a list of available coupons.

### `GET /check`
- Checks if the user is eligible to claim a coupon.

### `POST /claim`
- Claims a coupon if the user is eligible.
- Request Body:
  ```json
  {
    "userId": "12345"
  }
  ```

## Deployment
- Deploy using services like Vercel, Railway, or Render.

## License
This project is licensed under the MIT License.

