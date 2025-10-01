# LLM-based-Clinical-Copilot-A-Generative-AI-Solution-for-Streamlining-Electronic-Health-Records

## Get Started

This project consists of a **frontend built with React** and a **backend that uses MongoDB**. Together, they form a generative AI copilot to streamline electronic health record workflows.

---

## Frontend Setup

1. Navigate into the frontend directory:
   ```bash
   cd my-react-app/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

> The app should be available at something like `http://localhost:3000`.

---

## Backend Setup

1. Create a `.env` file by substituting your credentials into the provided `.env.example`.

2. Navigate into the server directory:
   ```bash
   cd server/
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```

5. Test the backend connection with `curl` in a separate terminal:
   ```bash
   curl http://localhost:<PORT>/health
   ```
   Replace `<PORT>` with the value you configured in your `.env`.

---

## Notes

- Ensure **MongoDB** is running and reachable before starting the backend (NUS WIFI will fail to connect).
- Frontend and backend should run simultaneously for full functionality.
