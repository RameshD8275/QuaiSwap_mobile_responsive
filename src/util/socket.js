"use client";
import { io } from 'socket.io-client';

import Config from "./config";

const Socket = new io(Config.SOCKET_URL)
export default Socket