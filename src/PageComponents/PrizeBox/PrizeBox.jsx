import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./PrizeBox.module.css";
import Button from "../Button/Button";
function PrizeBox({
  icon,
  text: { top, prize, prizeDesc, boxDesc, btnText },
  color,
}) {
  return (
    <div
      className={`${styles.prizeBox} ${color ? styles.purple : styles.yellow}`}
    >
      <FontAwesomeIcon icon={icon} />
      <div className={styles.textPart}>
        <h4>{top}</h4>
        <h1>{prize}</h1>
        <h4>{prizeDesc}</h4>
        <p>{boxDesc}</p>
      </div>
      <Button arrow text={btnText} />
    </div>
  );
}

export default PrizeBox;
