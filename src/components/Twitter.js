import React, { useEffect } from "react";
import { Button } from "antd";

function Twitter() {
   
  const CLIENT_ID = "WEFXa0pIUVJHbVlVYzRDZDNMZjg6MTpjaQ"; // Replace with your OAuth 2.0 Client ID
  const REDIRECT_URI = "https://quaiswap.io/callback"; // Replace with your backend's callback endpoint
  const AUTHORIZATION_ENDPOINT = "https://x.com/i/oauth2/authorize"; // Replace with the provider's authorization endpoint
  const SCOPES = "tweet.read users.read follows.read follows.write";
const STATE = "random_string"; // A randomly generated string to prevent CSRF attacks
const CODE_CHALLENGE = "challenge"; // Replace with a securely generated code challenge

const handleConnect = () => {
    const authUrl = `${AUTHORIZATION_ENDPOINT}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(SCOPES)}&state=${STATE}&code_challenge=${CODE_CHALLENGE}&code_challenge_method=plain`;

    window.location.href = authUrl;
  };

  return (
    <div className="textBox">
      {/* Centered Title */}
      <div className="tradeBoxHeader">
        <h2 style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>
          QUAI Airdrop (Beta)
        </h2>
      </div>
  
      {/* Centered Content */}
      <div
        style={{
          color: "white",
          background: "#1c1c1e",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          maxWidth: "800px",
          margin: "20px auto",
          lineHeight: "1.8",
        }}
      >
        <p style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
          Connecting your Twitter account to Quaiswap could make you eligible for the
          QUAI airdrop.
        </p>
        <b>Requirements for eligibility: </b>
        <ul style={{ textAlign: "left", marginLeft: "20px", fontSize: "16px" }}>
          <li>At least 100 followers</li>
          <li>At least one Twitter post</li>
          <li>Follow on Twitter: <a href="https://x.com/Quaiswapio" style={{color: "white"}}>@Quaiswapio</a> <a href="https://x.com/QuaiNetwork" style={{color: "white"}}>@QuaiNetwork</a> <a href="https://x.com/poopdotfun69" style={{color: "white"}}>@poopdotfun69</a></li>
        </ul>
        <p style={{ marginBottom: "15px", marginTop: "15px"}}>
          By connecting, you grant us permission to:
        </p>
        <ul style={{ textAlign: "left", marginLeft: "20px", fontSize: "16px" }}>
          <li>View your handle and follower count</li>
          <li>Follow the @Quaiswapio account on your behalf</li>
        </ul>
        <p style={{ marginTop: "20px" }}>
          <strong>Note:</strong> We will never post tweets or access your DMs (we can't).
        </p>
        <strong>Note 2: You will receive 1 QUAI testnet token. Please report all bugs to <a href="https://t.me/quaiswapexchange" style={{color: "white"}}>Quaiswap Telegram</a></strong>
      </div>
  
      {/* Centered Button */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <Button
          className="bigButton2"
          style={{
            background: "#E22901",
            color: "white",
            fontWeight: "bold",
            padding: "15px 30px",
            fontSize: "18px",
            borderRadius: "10px",
            marginLeft: "100%",
          }}
          onClick={handleConnect}
        >
          Connect with Twitter
        </Button>
      </div>
    </div>
  );
}

export default Twitter;