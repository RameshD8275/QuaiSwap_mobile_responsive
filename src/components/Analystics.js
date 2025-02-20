import React from "react";
import tokenList from "../assets/tokenList.json";

function Analystics() {
    return (
        <div>
            <h2>Available Tokens</h2>
            <div className="token-list">
                {
                    tokenList.map((token, index) => (
                        <div key={index} className="token-item">
                            <img
                                src={token.img}
                                alt={token.symbol}
                                className="token-image-small" />
                            <div className="token-info">
                                <div className="token-name">{token.name}</div>
                                <div className="token-symbol">( {token.symbol} )</div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

export default Analystics;
