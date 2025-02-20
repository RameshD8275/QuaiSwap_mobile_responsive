import React, { useState } from "react";
import Logo from "../assets/img/QuaiSwap.png";
import Quai from "../assets/img/quai.png";
import { Link } from "react-router-dom";
import telegram from "../assets/img/telegram.png";
import '../Header.css'

function Header(props) {
    const { address, isConnected, connect } = props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    return (
        <header className="header">
            {/* Logo */}
            <img src={Logo} alt="logo" className="w-[140px] h-[40px]" />
            {/* Group of Links */}
            <div className={`header__links ${isMobileMenuOpen ? 'open' : ''}`}>
                <Link to="/" className="link">
                    <div className="headerItem">Swap</div>
                </Link>
                <Link to="/liquidity" className="link">
                    <div className="headerItem">Liquidity</div>
                </Link>
                <Link to="/farms" className="link">
                    <div className="headerItem">Farms</div>
                </Link>
                {/* <Link to="/staking" className="link">
                    <div className="headerItem">Staking</div>
                </Link> */}
                {/* <Link to="/migrate" className="link">
                    <div className="headerItem">Token Migration (Testing)</div>
                </Link> */}
                <Link to="/migrate" className="link">
                    <div className="headerItem">Token Migration (Testing)</div>
                </Link>
                {/*<Link to="/airdrop" className="link">
                    <div className="headerItem">QUAI Airdrop</div>
                </Link>*/}
            </div>
            <div className="flex gap-4 min-w-[110px]">
                <div className="flex min-w-[25px] h-[25px]">
                    <a href="https://t.me/quaiswapexchange" target="_blank" rel="noopener noreferrer">
                        <img src={telegram} alt="Telegram" className="w-[25px] h-[25px]" />
                    </a>
                </div>
                <div className="h-[25px] flex cursor-pointer">
                    <img src={Quai} alt="quai" className="w-[25px] h-[25px]" />
                    <p className="ps-2 hover:text-[#E22901]">Quai</p>
                </div>

            </div>
            {/* Wallet Connect Button */}
            <div className="flex items-center px-6 header__menu-col">
                <div className="flex justify-center items-center connectButtonWrap">
                    <div className="connectButton" onClick={connect}>
                        {
                            isConnected && address != undefined ? address.slice(0, 6) + "..." + address.slice(38) : "Connect"
                        }
                    </div>
                </div>

                {/* Mobile Menu Icon */}
                <div className="header__menu-icon" onClick={toggleMobileMenu}>
                    <span className="menu-bar"></span>
                    <span className="menu-bar"></span>
                    <span className="menu-bar"></span>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="header__mobile-menu">
                    <Link to="/" className="link" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="headerItem">Swap</div>
                    </Link>
                    <Link to="/liquidity" className="link" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="headerItem">Liquidity</div>
                    </Link>
                    <Link to="/farms" className="link" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="headerItem">Farms</div>
                    </Link>
                    {/* <Link to="/staking" className="link" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="headerItem">Staking</div>
                    </Link>
                    <Link to="/migrate" className="link" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="headerItem">Token Migration (Testing)</div>
                    </Link> */}
                    <Link to="/airdrop" className="link" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="headerItem">QUAI Airdrop</div>
                    </Link>
                    <div className="connectButton" onClick={connect}>
                        {
                            isConnected && address != undefined ? address.slice(0, 6) + "..." + address.slice(38) : "Connect"
                        }
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
