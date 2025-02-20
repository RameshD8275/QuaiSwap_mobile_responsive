import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalculator,
  faChevronDown,
  faCircleCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import {
  PlusOutlined,
  DownOutlined,
} from "@ant-design/icons";
import styles from "./FarmRow.module.css";
import Button from "../Button/Button.jsx";
import goTo from "../../assets/go-to-arrow.svg";
import TooltipContent from "../TooltipContent/TooltipContent.jsx";
import {
  Tooltip,
} from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import { useAccount, useConnect, useBalance } from "wagmi";
import { quais } from 'quais'
import pairABI from "../../assets/abi/ILiquidity.json";
import masterchefABI from "../../assets/abi/IMasterChef.json";
import { Modal, Input, message, Slider } from "antd";
import wagmiConfig from "../../util/wagmiconfig.js";
import { readContract, multicall } from "@wagmi/core";

const TimeList = ['1D', '7D', '30D', '1Y', '5Y']
const TieList = ['1D', '7D', '14D', '30D']
const stakePeriod = [1, 7, 30, 365, 365 * 5]
const compoundEvery = [365, 7, 14, 30]

function StakeRow({
  icon,
  image,
  lpEarned,
  liquidity,
  contractUrl,
  getUrl,
  pairInfoUrl,
  name,
  stakedBalance
}) {
  const [openRow, setOpenRow] = useState(false)

  return (
    <div className={styles.farmRow}>
      <div
        className={styles.farmRowTop1}
        onClick={()=>{
          setOpenRow(!openRow)
        }}
      >
        <div className={styles.rowCol}></div>
        <div className={styles.rowImg}>
          <div className={styles.absDiv}>
            <img src={image} className={styles.absImg} alt="" />
            <img src={icon} alt="" />
          </div>
          <h1>{name}</h1>
        </div>
        <div className={styles.rowCol}></div>
        <div className={styles.rowCol}>
          <p>Earned LP</p>
          <h5>{lpEarned.toFixed(4).toString()}</h5>
        </div>
        <div className={styles.rowCol}></div>
        <div className={styles.rowCol}
          ><p>Total Liquidity</p>
          <h5>{liquidity.toFixed(4).toString()}</h5>
        </div>
        <div className={styles.rowCol}></div>
        <div className={styles.rowCol}
          ><p>Staked QSWAP</p>
          <h5>{stakedBalance}</h5>
        </div>
        <div className={styles.rowCol}></div>
      </div>
    </div>
  );
}

export default StakeRow;
