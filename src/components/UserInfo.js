import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, message } from "antd";
import { useAccount, useChainId } from "wagmi";
import { useQuaisProvider } from "../util/provider";
import Config from "../util/config";

function UserInfo({ accessToken, messageApi }) {
  const [userInfo, setUserInfo] = useState(null);
  const [followStatus, setFollowStatus] = useState(null);
  
  const [qswapTxHash, setQswapTxHash] = useState("");

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { walletProvider, error } = useQuaisProvider(chainId);
    if (error != null) {
        console.log('error', error)
    }

  useEffect(() => {
    if (accessToken) {
      axios
        .get(`${Config.airdrop_URL}/user-info`, { params: { access_token: accessToken } })
        .then((response) => {
          setUserInfo(response.data);
          if(response.data.qswap && response.data.qswap !== "") {
            setQswapTxHash(response.data.qswap);
          }
        })
        .catch((error) => {
            messageApi.error("Failed to fetch user info: " + error.response?.data?.error);
          console.error("Error fetching user info:", error.response?.data || error.message);
        });
    }
  }, [accessToken]);

  const handleFollow = async () => {
    if (!isConnected || !address) {
        messageApi.error("Wallet not connected");
        return;
      }
      let hide;
    try {
        let signer = await walletProvider.getSigner();
        let sig = await signer.signMessage("Migrate tokens");
        
        hide = messageApi.loading("Following and claiming tokens...", 0);

        const res = await axios.post(
        `${Config.airdrop_URL}/follow?access_token=${accessToken}`,
        { id: userInfo.id, sig: sig, address: address } // Send the authenticated user's ID
        );
        hide(); // remove loading
        messageApi.success("Claim successful");
        console.log("Follow response:", res.data);
        setQswapTxHash(res.data.qswap);
        setFollowStatus("Claim successful!");
    } catch (error) {
        console.error(error);
        messageApi.error("Claim failed: " + error.response?.data?.error);
      } finally {
          if (hide) hide();
    }
  };

  return (
    <div className="tradeBox">
      <div className="tradeBoxHeader">
      <h2 style={{ color: "white", fontWeight: "bold", textAlign: "center", marginLeft: "20%" }}>
          QSWAP Airdrop (Beta)
        </h2>
      </div>
      {userInfo ? (
        <div className="inputs">
          <div className="normal-Input-Div-2">
            <div className="input-component">
              <div className="input-custom-migrate">{userInfo.name}</div>
              <div className="asset">Name</div>
            </div>
          </div>
          <div className="normal-Input-Div-2">
            <div className="input-component">
              <div className="input-custom-migrate">@{userInfo.username}</div>
              <div className="asset">Twitter Handle</div>
            </div>
          </div>
          <div className="normal-Input-Div-2">
            <div className="input-component">
              <div className="input-custom-migrate">{userInfo.followers_count}</div>
              <div className="asset">Followers</div>
            </div>
          </div>
          <div className="normal-Input-Div-2">
            <div className="input-component">
              <div className="input-custom-migrate">{userInfo.numTokens || "0"}</div>
              <div className="asset">Claimable Tokens {userInfo.error ? `(${userInfo.error})` : ""}</div>
            </div>
          </div>
          {userInfo.smart_follower && (
            <div className="normal-Input-Div-2">
            <div className="input-component">
              <div className="input-custom-migrate">{"10x"}</div>
              <div className="asset">Kaito Smart Follower Bonus</div>
            </div>
          </div>
          )}
          <Button className="bigButton" onClick={handleFollow}>
            Follow and Claim
          </Button>
          {followStatus && <p style={{ color: "white" }}>{followStatus}</p>}
          {qswapTxHash && (
            <a
              href={`https://quaiscan.io/tx/${qswapTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "white", fontWeight: "bold" }}
            >
              QUAI TX: {qswapTxHash}
            </a>
          )}
        </div>
      ) : (
        <p style={{ color: "white" }}>Loading user info...</p>
      )}
    </div>
  );
}

export default UserInfo;