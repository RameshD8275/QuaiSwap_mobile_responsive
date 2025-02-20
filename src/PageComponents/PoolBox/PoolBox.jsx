import React, { useState } from "react";
import {
  faArrowsRotate,
  faCalculator,
  faChevronDown,
  faQuestionCircle,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import goTo from "../../assets/go-to-arrow.svg";
import styles from "./PoolBox.module.css";
function PoolBox({
  icon,
  image,
  firstHead,
  headDesc,
  tokenInfo,
  tutorial,
  ViewContact,
  auto,
  totalStaked,
  totalLocked,
  fee,
  apr,
  duration,
}) {
  const [openHidden, setOpenHidden] = useState(false);
  return (
    <div className={styles.poolBox}>
      <div className={styles.topBox}>
        <div className={styles.firstHead}>
          <p>{firstHead}</p>
          <h5>{headDesc}</h5>
        </div>
        <div className={styles.absDiv}>
          <img src={image} className={styles.absImg} alt="" />
          <img src={icon} alt="" />
        </div>
      </div>
      <div className={styles.row}>
        <h5>APR</h5>
        <p>
          {apr}% <FontAwesomeIcon icon={faCalculator} />
        </p>
      </div>
      <div className={styles.connectDiv}>
        <p>START EARNING</p>
        <Button text={"Connect Wallet"} />
      </div>
      <div className={styles.bottomBox}>
        {auto ? (
          <div className={styles.row}>
            <div className={styles.check}>
              <FontAwesomeIcon icon={faArrowsRotate} />
              <p>Auto</p>
            </div>
            <FontAwesomeIcon icon={faQuestionCircle} />
          </div>
        ) : (
          <div className={styles.row}>
            <div className={styles.redCheck}>
              <FontAwesomeIcon icon={faRotateRight} />
              <p>Manual</p>
            </div>
            <FontAwesomeIcon icon={faQuestionCircle} />
          </div>
        )}
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
      </div>
      <div className={`${styles.hidden} ${openHidden && styles.display}`}>
        <div className={styles.rowCol}>
          <p>Total Locked:</p>
          <p>{totalLocked}</p>
        </div>
        <div className={styles.rowCol}>
          <p>Average lock duration:</p>
          <p>{duration}</p>
        </div>
        <div className={styles.rowCol}>
          <p style={{}}>Performance Fee</p>
          <p>{fee}</p>
        </div>
        <div className={styles.rowCol}>
          <p>Total Staked</p>
          <p>{totalStaked} CAKE</p>
        </div>
        <a href={tokenInfo}>
          See Token Info <img src={goTo} alt="" />
        </a>
        <a href={tutorial}>
          View Tutorial
          <img src={goTo} alt="" />
        </a>
        <a href={ViewContact}>
          View Contract <img src={goTo} alt="" />
        </a>
      </div>
    </div>
  );
}

export default PoolBox;
