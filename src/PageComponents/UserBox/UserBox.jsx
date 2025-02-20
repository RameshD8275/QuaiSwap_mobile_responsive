import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./UserBox.module.css";
function UserBox({ desc, icon, head, span, color }) {
  return (
    <div className={styles.userBox}>
      <FontAwesomeIcon icon={icon} style={{ color: color }} />
      <div className={styles.boxText}>
        <h1>
          {head} <span style={{ color: color }}>{span}</span>
        </h1>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default UserBox;
