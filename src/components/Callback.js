import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import UserInfo from "./UserInfo";
import { Button, message } from "antd";
import Config from "../util/config";

function Callback() {
    const hasRun = useRef(false);
    const [accessToken, setAccessToken] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state === "random_string") {
      // Exchange the authorization code for an access token
      axios
        .post(`${Config.airdrop_URL}/token`, { code })
        .then((response) => {
          console.log("Access Token:", response.data.access_token);
            setAccessToken(response.data.access_token);
        })
        .catch((error) => {
        messageApi.error("Failed to connect to Twitter: " + error.response?.data?.error);
        console.error("Error exchanging token:", error.response?.data || error.message);
        });
    }
  }, []);

  if (accessToken) {
    return (
      <div>
        {contextHolder}
        <UserInfo accessToken={accessToken} messageApi={messageApi} />
      </div>
    );
  }

  return (
    
  <div>{contextHolder} Authenticating...</div>
    );
}

export default Callback;
