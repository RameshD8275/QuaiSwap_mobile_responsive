import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import styles from "./Button.module.css";
function Button({ inverse, arrow, text, plus, disabled, clickevent }) {
  return (
    <button 
      className={disabled? styles.disableBtn : !inverse ? styles.mainBtn : styles.inverseBtn} 
      onClick={()=> {
        clickevent()}
      }
      disabled={disabled}
      >
      {plus && <FontAwesomeIcon icon={faPlus} />} {text}{" "}
      {arrow && <FontAwesomeIcon icon={faMinus} />}
    </button>
  );
}

export default Button;
