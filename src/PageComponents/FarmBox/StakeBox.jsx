import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCalculator,
    faChevronDown,
    faCircleCheck,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./FarmBox.module.css";
import goTo from "../../assets/go-to-arrow.svg";
import Button from "../Button/Button";
function StakeBox({
    icon,
    image,
    lpEarned,
    liquidity,
    contractUrl,
    getUrl,
    pairInfoUrl,
    name,
}) {
    useEffect(() => {
        console.log('PoolDataData', icon,
            image,
            lpEarned,
            liquidity,
            contractUrl,
            getUrl,
            pairInfoUrl,
            name)
    }, [])
    const [openHidden, setOpenHidden] = useState(false);
    return (
        <div className={styles.farmBox}>
            <div className={styles.topFarmBox}>
                <div className={styles.absDiv}>
                    <img src={image} className={styles.absImg} alt="" />
                    <img src={icon} alt="" />
                </div>
                <div className={styles.farmName}>
                    <h1>{name}</h1>
                    <div className={styles.row}>
                        {/* {core ? (
              <div className={styles.check}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Core</p>
              </div>
            ) : (
              <div className={styles.redCheck}>
                <FontAwesomeIcon icon={faUsers} />
                <p>Farm Auction</p>
              </div>
            )} */}
                    </div>
                </div>
            </div>
            <div className={styles.detailsDiv}>
                <div className={styles.detailRow}>
                    <p>Earn:</p>
                    <h5>WQUAI + Fees</h5>
                </div>
            </div>
            <div className={styles.earnedDiv}>
                <h5>Earned</h5>
                <div className={styles.earnRow}>
                    <p>{lpEarned}</p>
                    <button className={styles.harvest}>HARVEST</button>
                </div>
            </div>
            <div className={styles.connectDiv}>
                <p>{name} LP STAKED</p>
                <Button text={"Connect Wallet"} />
            </div>
            <p
                onClick={() => setOpenHidden((prev) => !prev)}
                className={styles.hiddenSwitch}
            >
                {openHidden ? "Hide" : "Details"}{" "}
                <FontAwesomeIcon
                    className={`${openHidden && styles.rotate}`}
                    icon={faChevronDown}
                />
            </p>
            <div className={`${styles.hidden} ${openHidden && styles.openHidden}`}>
                <div className={styles.detailRow}>
                    <p>Total Liquidity</p>
                    <h5>{liquidity}</h5>
                </div>
                <a href={getUrl}>
                    Get CAKE-BNB LP <img src={goTo} alt="" />
                </a>
                <a href={contractUrl}>
                    View Contract
                    <img src={goTo} alt="" />
                </a>
                <a href={pairInfoUrl}>
                    See Pair Info <img src={goTo} alt="" />
                </a>
            </div>
        </div>
    );
}

export default StakeBox;
