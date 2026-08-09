import axios from "axios";
import API_BASE_URL from "../config/api";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});