import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalculator,
  faChevronDown,
  faRotateRight,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";

import styles from "./PoolRow.module.css";
import Button from "../../PageComponents/Button/Button";
import goTo from "../../assets/go-to-arrow.svg";
function PoolRow({
  icon,
  image,
  firstHead,
  headDesc,
  flexible,
  locked,
  tokenInfo,
  tutorial,
  ViewContact,
  name,
  auto,
  staked,
  profit,
  totalStaked,
  totalLocked,
  fee,
  duration,
}) {
  const [openRow, setOpenRow] = useState(false);
  return (
    <div className={styles.poolRow}>
      <div
        onClick={() => setOpenRow((prev) => !prev)}
        className={styles.poolRowTop}
      >
        <div className={styles.rowImg}>
          <div className={styles.absDiv}>
            <img src={image} className={styles.absImg} alt="" />
            <img src={icon} alt="" />
          </div>
          <div className={styles.firstHead}>
            <p>{firstHead}</p>
            <h5>{headDesc}</h5>
          </div>
        </div>
        <div className={styles.rowColDesk}>
          <p>{name} Staked</p>
          <h4>{staked}</h4>
          <h6>0 USD</h6>
        </div>
        <div className={styles.rowCol}>
          <p>Flexible APY</p>
          <h5>
            {flexible} <FontAwesomeIcon icon={faCalculator} />
          </h5>
        </div>
        <div className={styles.rowCol}>
          <p>Locked APY</p>
          <h5>
            {locked} <FontAwesomeIcon icon={faCalculator} />
          </h5>
        </div>
        <div className={`${styles.rowCol} ${styles.displayNone}`}>
          <p>Total Staked</p>
          <h5>
            {totalStaked} {name}
          </h5>
        </div>
        <p className={styles.hiddenSwitch}>
          {window.innerWidth > 710 ? (openRow ? "Hide" : "Details") : ""}
          <FontAwesomeIcon
            className={`${openRow && styles.rotate}`}
            icon={faChevronDown}
          />
        </p>
      </div>
      <div
        className={`${styles.poolRowBottom} ${openRow && styles.poolRowOpen}`}
      >
        <div className={styles.mob2}>
          <div className={styles.row2}>
            <p>Flexible APY</p>
            <h5>
              {flexible}% <FontAwesomeIcon icon={faCalculator} />
            </h5>
          </div>
          <div className={styles.row2}>
            <p>Locked APY</p>
            <h5>
              Up to {locked}% <FontAwesomeIcon icon={faCalculator} />
            </h5>
          </div>
        </div>
        <div className={styles.rowLinks}>
          <div className={styles.rowCol}>
            <p>Total Locked:</p>
            <p>{totalLocked}</p>
          </div>
          <div className={styles.rowCol}>
            <p style={{ borderBottom: "1px dashed var(--light-purple)" }}>
              Average lock duration:
            </p>
            <p>{duration}</p>
          </div>
          <div className={styles.rowCol}>
            <p style={{ borderBottom: "1px dashed var(--light-purple)" }}>
              Performance Fee
            </p>
            <p>{fee}</p>
          </div>
          <div className={styles.mob}>
            <p style={{ borderBottom: "1px dashed var(--light-purple)" }}>
              Total Staked
            </p>
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
        </div>
        <div className={styles.btnDiv}>
          <div className={styles.earnedDiv}>
            <h5>Recent Cake Profit </h5>
            <p>{profit}</p>
          </div>
          <div className={styles.earnedDiv}>
            <h5>START STAKING</h5>
            <Button text={"Connect Wallet"} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoolRow;
