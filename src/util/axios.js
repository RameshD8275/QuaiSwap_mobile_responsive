import axios from 'axios';
import config from "./config"

// ----------------------------------------------------------------------
const axiosInstance = axios.create({
  // eslint-disable-next-line no-undef
  baseURL: `${config.API_URL}`,
  headers: {
    "Accept": "*/**",
    "content-Type": "application/json",
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Access-Control-Allow-Headers, Content-Type, Authorization',
    'Access-Control-Allow-Methods': '*',
    "Cross-Origin-Resource-Policy": '*',
    "timeout": 1000,
  },
});

export default axiosInstance;
