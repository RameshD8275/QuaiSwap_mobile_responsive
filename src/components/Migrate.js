import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import { useAccount, useChainId } from "wagmi";
import axios from "axios";
import { useQuaisProvider } from "../util/provider";
import { quais } from "quais";
import Config from "../util/config";
function Migrate() {
  // Wagmi hooks: get connected wallet address & signer
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { walletProvider, error } = useQuaisProvider(chainId);
    if (error != null) {
        console.log('error', error)
    }

  // Local states
  const [qswapBalance, setQswapBalance] = useState("0");
  const [poopBalance, setPoopBalance] = useState("0");
  const [qswapTxHash, setQswapTxHash] = useState("");
  const [poopTxHash, setPoopTxHash] = useState("");

  // For user feedback
  const [messageApi, contextHolder] = message.useMessage();


  /**
   * On component mount or when address changes, fetch balances.
   */
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  /**
   * Fetch QSWAP & POOP balances from backend.
   */
  const fetchBalances = async () => {
    let hide;
    try {
      // Show loading message
        hide = messageApi.loading("Fetching balances...", 0);

        const res = await axios.get(`${Config.airdrop_URL}/getBalance`, {
        params: { address },
        });

        // Update local state
        setQswapBalance(res.data.qswap);
        setPoopBalance(res.data.poop);
        if (res.data.qswapTxHash && res.data.qswapTxHash !== "") {
            setQswapTxHash(res.data.qswapTxHash);
        }
        if (res.data.poopTxHash && res.data.poopTxHash !== "") {
            setPoopTxHash(res.data.poopTxHash);
        }
        messageApi.success("Balances fetched");
    } catch (error) {
      console.error(error);
      messageApi.error("Failed to fetch balances");
    } finally {
      if (hide) hide();
    }
  };

  /**
   * Prompt user to sign a message, then POST signature to backend for migration.
   */
  const handleMigrate = async () => {
    if (!isConnected || !address) {
      messageApi.error("Wallet not connected");
      return;
    }
    let hide;
    try {

        let signer = await walletProvider.getSigner();
        let sig = await signer.signMessage("Migrate tokens");
        // Show loading indicator
        hide = messageApi.loading("Migrating tokens...", 0);

        // Send signature & address to backend
        const res = await axios.post(`${Config.airdrop_URL}/migrate`, {
        address,
        sig,
        });

        // Update local state with tx hashes
        setQswapTxHash(res.data.qswap);
        setPoopTxHash(res.data.poop);

        hide(); // remove loading
        messageApi.success("Migration successful");
    } catch (error) {
      console.error(error);
      messageApi.error("Migration failed: " + error.response?.data?.error);
    } finally {
        if (hide) hide();
      }
  };

  return (
    <div className="tradeBox">
      {/* Ant Design message context holder */}
      {contextHolder}

      {/* Header (like your Swap page) */}
      <div className="tradeBoxHeader">
        <div className="tradeBoxSubHeaderButtonGroup">
          <Button className="subHeaderbutton" style={{ background: "#E22901" }}>
            Migrate
          </Button>
        </div>
      </div>

      {/* Balances display */}
      <div className="inputs" style={{width: "100%"}}>
        <div className="normal-Input-Div-2">
        <div className="input-component" style={{ marginTop: '10px' }}> 
        <div className="input-custom-migrate">{parseFloat(quais.formatQuai(qswapBalance)).toFixed(4)}</div>
        <div className="asset">
            <img src={"/assets/quaiswap.png"} alt="assetLogo" className="assetLogo" />
            QSWAP
            </div>
        </div>
        <div className="tokenBalance" >
                            QSWAP Balance
                        </div>
          
        </div>
        <div className="normal-Input-Div-2">
        <div className="input-component" style={{ marginTop: '10px' }}> 
        <div className="input-custom-migrate">{parseFloat(quais.formatQuai(poopBalance)).toFixed(4)}</div>
        <div className="asset">
            <img src={"/assets/poop_logo_rotating_css.gif"} alt="assetLogo" className="assetLogo" />
            POOP
            </div>
        </div>
        <div className="tokenBalance" >
                            POOP Balance
                        </div>
          
        </div>
      </div>

      {/* Migrate button */}
      <Button
        className="bigButton"
        disabled={!isConnected || (qswapBalance === "0" && poopBalance === "0") || qswapTxHash || poopTxHash}
        onClick={handleMigrate}
      >
        Migrate
      </Button>

      {/* Transaction hashes as hyperlinks to Quaiscan */}
      {qswapTxHash && (
        <div style={{ marginTop: "15px", textAlign: "left" }}>
          <a
            href={`https://orchard.quaiscan.io/tx/${qswapTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", fontWeight: "bold" }}
          >
            QSWAP TX: {qswapTxHash}
          </a>
        </div>
      )}
      {poopTxHash && (
        <div style={{marginTop: "5%", textAlign: "left"}}>
          <a
            href={`https://orchard.quaiscan.io/tx/${poopTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "white", fontWeight: "bold" }}
          >
            POOP TX: {poopTxHash}
          </a>
        </div>
      )}
    </div>
  );
}

export default Migrate;