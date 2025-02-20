
import React, { createContext } from "react";
import { Routes, Route } from "react-router-dom";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Liquidity from "./components/Liquidity";
import Farms from "./components/Earn/Farms";
import Migrate from "./components/Migrate";
import Twitter from "./components/Twitter";
import Callback from "./components/Callback";
import Staking from "./components/Staking/Staking";
// import Tokens from "./components/Tokens";

export const AppContext = createContext(null);

function App() {
    const { address, isConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const { disconnect } = useDisconnect();

    const handleConnectWallet = () => {
        console.log("Handling wallet connect...");
        if (isConnected)
            disconnect();
        else {
            for (let i = 0; i < connectors.length; i++) {
                console.log("Connector:", connectors[i].uid, connectors[i].name);
                if (connectors[i].name === 'Pelagus')
                connect({ connector: connectors[i] });
            }
        }
    };

    return (
        <AppContext.Provider value={{}}>
            <div className="App">
                <Header connect={handleConnectWallet} isConnected={isConnected} address={address} />
                <div className="mainWindow">
                    <Routes>
                        <Route path="/" element={<Swap isConnected={isConnected} address={address} />} />
                        <Route path="/liquidity" element={<Liquidity />} />
                        <Route path="/farms" element={<Farms />} />
                        {/* <Route path="/staking" element={<Staking />} /> */}
                        <Route path="/migrate" element={<Migrate />} />
                        <Route path="/airdrop" element={<Twitter />} />
                        <Route path="/callback" element={<Callback />} />
                    </Routes>
                </div>
            </div>
        </AppContext.Provider>
    );
}

export default App;
