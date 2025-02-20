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
import Button from "../../PageComponents/Button/Button";
import goTo from "../../assets/go-to-arrow.svg";
import TooltipContent from "../../PageComponents/TooltipContent/TooltipContent";
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

function FarmRow({
  image,
  icon,
  core,
  earned,
  apr,
  liquidity,
  multiplier,
  contractUrl,
  getUrl,
  pairInfoUrl,
  cakeEarned,
  name,
  lpTokenAddress,
  lpTokenPrice,
  pid,
  allocPoint,
  totalAllocPoint,
  // RPCProvider,
}) {
  //messageAPI
  const walletProvider = new quais.BrowserProvider(window.pelagus);
  const [messageApi, contextHolder] = message.useMessage();
  const [openRow, setOpenRow] = useState(false);
  const [isAPRHovered, setIsAPRHovered] = useState(false);
  const [stateROIModal, setStateROIModal] = useState(false);
  const [qswapEarned, setQswapEarned] = useState(earned);
  const handleROIModalCancel = () => {
    setStateROIModal(false)
  }
  const [stateStakeLPModal, setStateStakeLPModal] = useState(false);
  const handleStakeLPModalCancel = () => {
    setStateStakeLPModal(false)
  }
  const [enableStaking, setEnableStaking] = useState(false);
  const [stakeType, setStakeType] = useState("Stake");
  const [lpAmount, setLpAmount] = useState(0.00);
  const [lpBalance, setLpBalance] = useState(0);
  const [lpStakedBalance, setLpStakedBalance] = useState(0);
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  // const RPCProvider = new quais.JsonRpcProvider('https://rpc.quai.network', undefined, { usePathing: true })
  // const walletProvider = new quais.BrowserProvider(window.pelagus);
  const masterchefAddress = "0x005b3EA05F4074515173fE04ff3A2a55723d0D60"; // Uniswap V2 Masterchef contract address
  const Zero = '0x0000000000000000000000000000000000000000';
  const lpPriceInUSD = 0.1 * lpTokenPrice;
  const { data, isError, isLoading, refetch } = useBalance({
    address: address,
    token: lpTokenAddress,
  });

  // ROICHECK_USD_QSWAP
  const [roiCheckBoxQSWAP, setROICheck] = useState(true)

  const [enableAPY, setAPYenable] = useState(false)
  const [isHidden, setHide] = useState(true)

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedTierIndex, setSelectedTierIndex] = useState(0)
  const [roiRate, setRoiRate] = useState(0);

  const [valueUSDT, setValueUSDT] = useState("0")
  const [valueLP, setValueLP] = useState("0")
  const [valueROI, setROIValue] = useState("0")
  const [stakedLiquidity, setStakedLiquidity] = useState(liquidity)
  console.log('allocPoint111', allocPoint)
  let tmpAPR = (Number(apr) * Number(allocPoint) / Number(totalAllocPoint)) * multiplier;
  console.log('APR', liquidity)
  if (liquidity > 0)
    tmpAPR = Number(tmpAPR / liquidity) * 100;
  else
    tmpAPR = 0;
  const [aprValue, setAprValue] = useState(Number(tmpAPR));
  const [apyValue, setApyValue] = useState(((1 + Number(tmpAPR) / (365 * 100)) ** 365 - 1) * 100);

  let remainingAllowance = 0;
  const lpTokenDecimals = 18;

  useEffect(() => {
    getLpBalance();
    getLpStakedBalance();
    isEnabledStaking();
    getStakedLiquidity();
  }, [isConnected, lpTokenAddress, data, earned]);

  const isEnabledStaking = async () => {
    try {
      if (address === Zero || lpTokenAddress === Zero || address === undefined) {
        setEnableStaking(false);
      } else {
        console.log('LPContract Address = ', lpTokenAddress);
        if (lpTokenAddress === Zero || lpTokenAddress === 0) {
          setEnableStaking(false);
          return;
        }
        // const pairContract = new quais.Contract(lpTokenAddress, pairABI, RPCProvider);
        // remainingAllowance = await pairContract.allowance(address, masterchefAddress);

        remainingAllowance = await readContract(wagmiConfig, {
          address: lpTokenAddress,
          abi: pairABI,
          functionName: "allowance",
          args: [address, masterchefAddress],
        })

        if (remainingAllowance > 0)
          setEnableStaking(true);
        else
          setEnableStaking(false);
      }
      console.log('isEnableStaking = ', enableStaking, 'remaining allowance = ', remainingAllowance);
    } catch (e) {
      console.log('isEnableStaking Error: ', e);
    }
  }
  const handleStartFarming = async () => {
    try {
      if (!isConnected) {
        for (let i = 0; i < connectors.length; i++) {
          console.log("Connector:", connectors[i].uid, connectors[i].name);
          if (connectors[i].name === 'Pelagus')
            connect({ connector: connectors[i] });
        }
      } else if (isConnected && !enableStaking) {
        if (isLoading) {
          console.log('Balance loading...');
        } else if (isError) {
          console.log('Balance loading error...');
        } else {
          console.log('Lp Balance = ', data);
          const signer = await walletProvider.getSigner();
          const pairContract = new quais.Contract(lpTokenAddress, pairABI, signer);
          if (remainingAllowance !== quais.MaxUint256) {
            const tx = await pairContract.approve(masterchefAddress, quais.MaxUint256);
            if (tx)
              await tx.wait(1);
            setEnableStaking(true);
          }
        }
      } else if (enableStaking) {

      }
    } catch (e) {
      console.log('Handl Start farming error :', e);
    }
  }

  const getStakedLiquidity = async () => {
    try {
      // const pairContract = new quais.Contract(lpTokenAddress, pairABI, RPCProvider);
      // Use Multicall
      // let farmTotalSupply = await pairContract.balanceOf(masterchefAddress);

      let farmTotalSupply = await readContract(wagmiConfig, {
        address: lpTokenAddress,
        abi: pairABI,
        functionName: "balanceOf",
        args: [masterchefAddress]
      })
      console.log('getStakedLiquidity', farmTotalSupply)
      farmTotalSupply = Number(quais.formatUnits(farmTotalSupply, lpTokenDecimals));
      setStakedLiquidity(farmTotalSupply * lpTokenPrice);
      let tmpAPRValue = (Number(apr) * Number(allocPoint) / Number(totalAllocPoint)) * multiplier;
      if (farmTotalSupply !== 0) {
        tmpAPRValue = Number(tmpAPRValue / (farmTotalSupply * lpTokenPrice)) * 100;
        setAprValue(tmpAPRValue);
        const aprDecimal = Number(tmpAPRValue) / 100;
        let tmpAPYValue = ((1 + aprDecimal / 365) ** 365 - 1) * 100;
        setApyValue(tmpAPYValue);
      }
      // const signer = await walletProvider.getSigner();
      // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, signer);

      if (address === Zero || address === undefined) {
        setQswapEarned(0);
      } else {
        // let tmpEarn = await masterchefContract.pendingQSWAP(pid, address);
        let tmpEarn = await readContract(wagmiConfig, {
          address: masterchefAddress,
          abi: masterchefABI,
          functionName: "pendingQSWAP",
          args: [pid, address],
        })
        tmpEarn = Number(quais.formatUnits(tmpEarn, lpTokenDecimals));
        setQswapEarned(tmpEarn);
      }
    } catch (e) {
      console.log(e)
    }
  }

  const getLpStakedBalance = async () => {
    try {
      // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
      console.log('getLpStakeBalance address= ', address, pid);
      if (address === Zero || pid === undefined || address === undefined) {
        console.log('Invalid address:', address);
        return 0;
      }
      // const userInfo = await masterchefContract.userInfo(pid, address);

      const userInfo = await readContract(wagmiConfig, {
        address: masterchefAddress,
        abi: masterchefABI,
        functionName: "userInfo",
        args: [pid, address]
      })
      console.log('userInfo.amount', userInfo, pid, address)
      const balance = Number(quais.formatUnits(userInfo[0], lpTokenDecimals));
      console.log('balance.balance', balance)
      setLpStakedBalance(balance);
      console.log('My Wallet addr = ', address, 'Lp Balance = ', balance);
      return balance;
    } catch (e) {
      console.log('getLpStakedBalance error : ', e);
    }
    return 0;
  }

  const handleUSD = () => {

  }

  const handleLP = () => {

  }

  const handleROI = (e) => {
    setROIValue(e)
  }

  const handleUnstakeFarm = async () => {
    try {
      setStakeType("Unstake");
      const balance = await getLpStakedBalance();
      if (balance > 0) {
        setStateStakeLPModal(true);
      } else {
        setStateStakeLPModal(false);
      }
    } catch (e) {
      console.log('Unstake Farm error: ', e);
    }
  }

  const getLpBalance = async () => {
    try {
      let amount = 0;
      if (data != undefined) {
        amount = Number(quais.formatUnits(data.value, lpTokenDecimals));
        setLpBalance(amount);
        console.log('Updated LP Balance = ', amount);
      }
      return amount;
    } catch (e) {
      console.log('getLpBalance error : ', e);
    }
  }

  const handleStakeFarm = async () => {
    setStakeType("Stake");
    const amount = await getLpBalance();
    if (amount > 0)
      setStateStakeLPModal(true);
  }

  const handleLpAmount = async (e) => {
    try {
      setLpAmount(e);
    } catch (e) {
      console.log('HandleLpAmount error: ', e)
    }
  }

  const checkConfirm = () => {
    if (stakeType === "Stake") {
      if (lpAmount <= 0 || lpAmount > lpBalance) {
        return false;
      }
    } else if (stakeType === "Unstake") {
      if (lpAmount <= 0 || lpAmount > lpStakedBalance) {
        return false;
      }
    }

    return true;
  }

  const setMaxAmount = async () => {
    try {
      let amount = 0;
      if (stakeType === "Stake") {
        amount = Number(quais.formatUnits(data.value, lpTokenDecimals));
        setLpAmount(amount);
      } else if (stakeType === "Unstake") {
        // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
        // const userInfo = await masterchefContract.userInfo(pid, address);

        const userInfo = await readContract(wagmiConfig, {
          address:masterchefAddress,
          abi:masterchefABI,
          functionName:"userInfo",
          args:[pid, address]
        })

        amount = Number(quais.formatUnits(userInfo[0], lpTokenDecimals));
        setLpAmount(amount);
      }
    } catch (e) {
      console.log('setMaxAmount error: ', e);
    }

  }

  const handleDepositLP = async () => {
    try {
      const signer = await walletProvider.getSigner();
      const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, signer);
      let depositAmount = 0;
      console.log('Deposit Amount handleDepositLP = ', depositAmount, masterchefContract, pid);
      const pairContract = new quais.Contract(lpTokenAddress, pairABI, signer);
      const allowance1 = await pairContract.allowance(address, masterchefAddress);
      if (allowance1 !== quais.MaxUint256) {
        console.log('Approving...');
        const tx = await pairContract.approve(masterchefAddress, quais.MaxUint256);
        if (tx) await tx.wait();
      }
      if (stakeType === "Stake") {
        if (lpAmount === lpBalance) {
          depositAmount = data.value;
        } else {
          depositAmount = quais.parseQuai(String(lpAmount), lpTokenDecimals);
        }
        let tx;
        let hide;
        try {
          tx = await masterchefContract.deposit(pid, depositAmount);
          hide = messageApi.loading("Depositing LP tokens...", 0);
          if (tx)
            await tx.wait(1);
          hide();
          messageApi.success("LP staked successfully!");
        } catch (error) {
          if (hide) hide(); // Ensure the message is hidden if there was an error
          messageApi.error("Staking failed");
          console.error(error);
        }
        await getLpStakedBalance();
        // await getLpBalance();
      } else if (stakeType === "Unstake") {
        if (lpAmount === lpStakedBalance) {
          // const masterchefContract1 = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
          // const userInfo = await masterchefContract1.userInfo(pid, address);

          const userInfo = await readContract(wagmiConfig, {
            address: masterchefAddress,
            abi: masterchefABI,
            functionName: "userInfo",
            args: [pid, address]
          })

          depositAmount = userInfo[0];
        } else {
          depositAmount = quais.parseQuai(String(lpAmount), lpTokenDecimals);
        }
        console.log('unstake step1...', pid);
        let tx;
        let hide;
        try {
          tx = await masterchefContract.withdraw(pid, depositAmount);
          hide = messageApi.loading("Withdrawing LP tokens...", 0);
          console.log('unstake step2...');
          if (tx)
            await tx.wait(1);
          hide();
          messageApi.success("Liquidity withdrawn successfully!");
        }
        catch (error) {
          if (hide) hide(); // Ensure the message is hidden if there was an error
          messageApi.error("Withdrawing failed");
          console.error(error);
        }
        getLpBalance();
      }
      await refetch();
    } catch (e) { console.log(e) }
  }

  const handleHarvest = async () => {
    try {
      const signer = await walletProvider.getSigner();
      const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, signer);
      if (address !== Zero) {
        let tx;
        let hide;
        try {
          tx = await masterchefContract.withdraw(pid, 0);
          hide = messageApi.loading("Harvesting rewards...", 0);
          if (tx)
            await tx.wait(1);
          hide();
          messageApi.success("Successfully harvested rewards!");
          setQswapEarned(0);
        } catch (error) {
          if (hide) hide(); // Ensure the message is hidden if there was an error
          messageApi.error("Harvest failed");
          console.error(error);
        }
      }
    } catch (e) {
      console.log('Harvest error :', e);
    }
  }

  const handlePriceInputChange = (e) => {
    try {
      let numericValue; // Remove non-numeric characters
      if (/^(\d+\.?\d*|\.\d*)$/.test(e.target.value))
        numericValue = e.target.value;
      console.log('input value = ', numericValue);
      handleDefinedPrice(numericValue);
    } catch (e) {
      console.log('Handle Price Input change error: ', e);
    }
  }

  const handleDefinedPrice = (priceUSD) => {
    try {
      console.log('change price1...', roiCheckBoxQSWAP, priceUSD);
      setValueUSDT(priceUSD);
      if (roiCheckBoxQSWAP) {
        setValueLP(Number(priceUSD * lpPriceInUSD).toFixed(2));
      } else {
        setValueLP(Number(priceUSD / lpPriceInUSD).toFixed(2));
      }
    } catch (e) {
      console.log('handleDefinedPrice error :', e);
    }
  }

  useEffect(() => {
    console.log('change check box...', roiCheckBoxQSWAP, valueLP, valueUSDT);
    if (roiCheckBoxQSWAP) {
      handleDefinedPrice(valueUSDT);
    } else {
      handleDefinedPrice(valueLP);
    }

  }, [roiCheckBoxQSWAP])

  useEffect(() => {
    ROICalc();
  }, [valueLP, valueUSDT, selectedIndex, selectedTierIndex, enableAPY])

  const ROICalc = () => {
    try {
      let roi = apr;
      let investAmount = 0;
      let apyEveryInterest = 0;
      if (roiCheckBoxQSWAP)
        investAmount = valueLP;
      else
        investAmount = valueUSDT;
      // if (enableAPY) {
      //   const aprDecimal = Number(aprValue) / 100;
      //   apyEveryInterest = ((1 + aprDecimal / 365) ** compoundEvery[selectedTierIndex] - 1) * 100;
      //   console.log('APY interest = ', apyEveryInterest);
      //   roi = Number(investAmount) * apyEveryInterest / 100;
      // } else {
        roi = Number(investAmount) * apr / 100;
      // }
      roi = roi * stakePeriod[selectedIndex] / 365;
      console.log('Roi at Current Rate = ', roi);
      if (investAmount > 0)
        setRoiRate((roi / investAmount) * 100);
      else
        setRoiRate(0);
      setROIValue(roi);
    } catch (e) {
      console.log('ROI Calc error: ', e);
    }
  }

  return (
    <div className={styles.farmRow}>
      {contextHolder}
      {
        <Modal open={stateROIModal} footer={null} onCancel={handleROIModalCancel} title="ROI Calculator">
          <div className='container'>
            <div className='row'>
              <div className='btn-section'>
                <label className="radio">
                  {name}
                  
                </label>
                <label className="radio">
                  <div className='togle'>
                    <label class="switch">
                      <input
                        type="checkbox"
                        className="checkBox"
                        onChange={() => {
                          setROICheck(!roiCheckBoxQSWAP);
                          console.log(roiCheckBoxQSWAP);
                        }} />
                      <span class="slider round"></span>
                    </label>
                  </div>
                  USD
                </label>
              </div>
            </div>

            <div className='price'>
              <input type="textbox" placeholder="0" className="input-ROI" onChange={handlePriceInputChange} value={valueUSDT}></input>
              <div> {roiCheckBoxQSWAP ? name : 'USD'}</div>
            </div>
            <div className='cake'>
              <div>{valueLP}</div>
              {!roiCheckBoxQSWAP ? name : 'USD'}
            </div>

            <div className='price-sel'>
              <span className='price-box' onClick={() => { roiCheckBoxQSWAP ? handleDefinedPrice(100 / lpPriceInUSD) : handleDefinedPrice(100) }}>$ 100</span>
              <span className='price-box' onClick={() => { roiCheckBoxQSWAP ? handleDefinedPrice(1000 / lpPriceInUSD) : handleDefinedPrice(1000) }}>$ 1000</span>
              <span className='price-box' onClick={() => { roiCheckBoxQSWAP ? handleDefinedPrice(lpStakedBalance) : handleDefinedPrice(lpStakedBalance * lpPriceInUSD) }}>My Balance</span>
            </div>

            <div className='time-frame'>
              <div className='time-title'>Staked For</div>
              <div className='button-list'>
                {
                  TimeList.map((item, index) => (<button onClick={() => setSelectedIndex(index)} className={selectedIndex === index ? 'time-button-active' : 'time-button'}>{TimeList[index]}</button>))
                }
              </div>
            </div>

            <div className='apy-wrap'>
              {/* <div className='acc-apy'>
                Enable Accelerated APY
                <div className='togle'>
                  <label class="switch">
                    <input type="checkbox" onChange={() => setAPYenable(!enableAPY)} />
                    <span class="slider round"></span>
                  </label>
                </div>
              </div> */}

            </div>

            {/* <div className='time-frame'>
              <div className='time-title'>Compounding Every</div>
              <div className='button-list'>
                {
                  TieList.map((item, index) => (<button onClick={() => setSelectedTierIndex(index)} className={selectedTierIndex === index ? 'time-button-active' : 'time-button'}>{TieList[index]}</button>))
                }
              </div>
            </div> */}

            <div className='cake Rate'>
              ROI at Current Rate
            </div>
            <div className='price current'>
              <input type="textbox" placeholder="$0" className="input-ROI" value={`$${valueROI}`} onChange={(e) => handleROI(e.target.value.replaceAll('$', ''))}></input>
              <div className='cake'>
                {roiRate}%
              </div>
            </div>

            <div className='Hide' onClick={() => setHide(!isHidden)}>
              {isHidden ? 'Show Details' : 'Hide Details'} <DownOutlined />
            </div>
            <div className={isHidden ? 'hide' : ''}>
              <div className='apy'>
                APR <span className='number'>{Number(aprValue).toFixed(4).toString()}%</span>
              </div>
              {/* <div className='apy'>
                APY <span className='number'>{Number(apyValue).toFixed(4).toString()}%</span>
              </div> */}
              <div className='apy'>
                Farm Multiplier <span className='number'>{multiplier}</span>
              </div>
              <ul className='litext'>
                <li>Calculated based on current rates.</li>
                <li>All figures are estimates provided for your convenience only, and by no means represent guaranteed returns.</li>
              </ul>
            </div>
          </div>
        </Modal >
      }
      {
        <Modal open={stateStakeLPModal} footer={null} onCancel={handleStakeLPModalCancel} title={`${stakeType} LP tokens`}>
          <div className='container'>
            <div className='stake-balance-title'>
              <label>
                {stakeType}
              </label>
              {
                stakeType === "Stake" ? (
                  <label>
                    Balance: {lpBalance}
                  </label>
                ) : (
                  <label>
                    Balance: {lpStakedBalance}
                  </label>
                )
              }

            </div>

            <div className='stake-balance-box'>
              <div className='stake-balance'>
                <input
                  placeholder="0"
                  className="input-custom"
                  value={lpAmount}
                  onChange={(e) => handleLpAmount(e.target.value)}
                />
                {/* USD */}
              </div>
              <button className='max-button' onClick={() => {
                setMaxAmount();
              }}>
                MAX
              </button>
              <div className='stake-label'>
                {name}
              </div>
            </div>

            {/* <div className='roicalculator-title'>
              <label>
                Annual ROI at current rates:
              </label>
              <div>
                <label>APR</label>
                <FontAwesomeIcon icon={faCalculator} />
              </div>
            </div> */}

            <div className="btn-box">
              <button className='enableBtn' onClick={() => { setStateStakeLPModal(false); }}>Cancel</button>
              {
                checkConfirm() === true ? (
                  <button className='enableBtn' onClick={() => {
                    handleDepositLP();
                  }}>Confirm</button>
                ) : (
                  <button className='disableBtn'>Confirm</button>
                )
              }

            </div>
          </div>
        </Modal >
      }

      <div
        onClick={() => {
          if (isAPRHovered === false) setOpenRow((prev) => !prev)
        }}
        className={styles.farmRowTop}
      >
        <div className={styles.rowImg}>
          <div className={styles.absDiv}>
            <img src={image} className={styles.absImg} alt="" />
            <img src={icon} alt="" />
          </div>
          <h1>{name}</h1>
        </div>
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
        <div className={styles.rowCol}>
          <p>Earned</p>
          <h5>{qswapEarned.toFixed(4).toString()}</h5>
        </div>
        <div className={styles.rowCol}
          onMouseEnter={() => setIsAPRHovered(true)}
          onMouseLeave={() => setIsAPRHovered(false)}
          onClick={() => {
            setStateROIModal(true);
          }}>

          <p>APR</p>
          <h5>
            {Number(aprValue).toFixed(4).toString()}%<FontAwesomeIcon icon={faCalculator} />
          </h5>
        </div>
        <div className={styles.rowColDesk}>
          <p>Liquidity</p>
          <Tooltip
            html={<TooltipContent content={"Total value of the funds in this farm’s liquidity pool"} />}
            interactive={true}
          >
            <h5>
              {stakedLiquidity.toFixed(4).toString()} WQUAI<FontAwesomeIcon icon={faQuestionCircle} />
            </h5>
          </Tooltip>
        </div>
        <div className={styles.rowColDesk}>
          <p>Multiplier</p>
          <Tooltip
            html={<TooltipContent content={"The Multiplier represents the proportion of QSWAP rewards each farm receives, as a proportion of the QSWAP produced each block.<br/><br/>For example, if a 1x farm received 1 QSWAP per block, a 40x farm would receive 40 QSWAP per block.<br/><br/>This amount is already included in all APR calculations for the farm."} />}
            interactive={true}
          >
            <h5>
              {multiplier}x<FontAwesomeIcon icon={faQuestionCircle} />
            </h5>
          </Tooltip>
        </div>
        <div className={styles.detailsDiv}>
          <h2>Details</h2>
          <FontAwesomeIcon
            className={`${openRow && styles.rotate}`}
            icon={faChevronDown}
          />
        </div>
      </div>
      <div
        className={`${styles.farmRowBottom} ${openRow && styles.farmRowOpen}`}
      >
        <div className={styles.rowLinks}>
          <a href={getUrl} target="_blank" rel="noopener noreferrer">
            Get {name} LP <img src={goTo} alt="" />
          </a>
          <a href={contractUrl} target="_blank" rel="noopener noreferrer">
            View Contract
            <img src={goTo} alt="" />
          </a>
          <a href={pairInfoUrl} target="_blank" rel="noopener noreferrer">
            See Pair Info <img src={goTo} alt="" />
          </a>
        </div>
        <div className={styles.btnDiv}>
          <div className={styles.earnedDiv}>
            <h5>Earned</h5>
            <div className={styles.earnRow}>
              <p>{qswapEarned.toFixed(4).toString()}</p>
              {
                qswapEarned > 0 ? (
                  <button className={styles.harvestEnable} onClick={() => {
                    handleHarvest();
                  }}>HARVEST</button>
                ) : (
                  <button className={styles.harvestDisable}>HARVEST</button>
                )
              }
            </div>
          </div>
          <div className={styles.earnedDiv}>
            <h5>START FARMING</h5>
            {!isConnected ? (
              <Button
                text={"Connect Wallet"}
                clickevent={() => {
                  handleStartFarming();
                }}
              />
            ) : (isConnected && !enableStaking) ? (
              <Button
                text={"Enable"}
                clickevent={() => {
                  handleStartFarming();
                }}
              />
            ) : (
              <div className={styles.buttonRow}>
                {
                  lpStakedBalance > 0 ? (
                    <Button
                      arrow={true}
                      clickevent={() => {
                        handleUnstakeFarm();
                      }}
                    />) : (
                    <Button
                      arrow={true}
                      clickevent={() => {
                        handleUnstakeFarm();
                      }}
                      disabled={true}
                    />)
                }
                {
                  lpBalance > 0 ? (
                    <Button
                      plus={true}
                      clickevent={() => {
                        handleStakeFarm();
                      }}
                    />
                  ) : (
                    <Button
                      plus={true}
                      clickevent={() => {
                        handleStakeFarm();
                      }}
                      disabled={true}
                    />
                  )
                }

              </div>
            )
            }
          </div>
        </div>

        <div className={styles.bottomRowCol}>
          <div className={styles.rowCol}>
            <p>APR</p>
            <h5>
              {apr} <FontAwesomeIcon icon={faCalculator} />
            </h5>
          </div>
          <div className={styles.rowCol}>
            <p>Liquidity</p>
            <h5>
              {liquidity.toFixed(4).toString()} <FontAwesomeIcon icon={faQuestionCircle} />
            </h5>
          </div>
          <div className={styles.rowCol}>
            <p>Multiplier</p>
            <h5>
              {multiplier} <FontAwesomeIcon icon={faQuestionCircle} />
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmRow;
