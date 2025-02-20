import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import stylesHeader from "../../PageComponents/FilterHeader/FilterHeader.module.css";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import styles from "./styles/Farms.module.css";
import smallIco from "../../assets/bnb.svg";
import small from "../../assets/small-ico.svg";
import styleRow from "../../PageComponents/FarmRow/FarmRow.module.css";
import StakeRow from "../../PageComponents/FarmRow/StakeRow.jsx";
import StakeBox from "../../PageComponents/FarmBox/StakeBox.jsx";
import { useAccount, useChainId, useBalance, useReadContract } from "wagmi";
import { FetchUserLiquidity } from "../FetchLiquidity.ts";
import { quais } from 'quais'
import factoryABI from "../../assets/abi/IUniswapV2Factory.json";
import pairABI from "../../assets/abi/ILiquidity.json";
import erc20ABI from "../../assets/abi/IERC20.json";
import stakingABI from "../../assets/abi/IStaking.json";
import wethABI from "../../assets/abi/IETH.json";
import { tokenList } from "../../constant/constant.js";
import tokenImg from "../../assets/img/tokenquestion.png";
import { Modal, Input, message, Slider } from "antd";
import wagmiConfig from "../../util/wagmiconfig.js";
import { readContract, multicall } from "@wagmi/core";
import { FetchTokenList } from "../../assets/FetchtokenList.js";
import { SelectOutlined } from "@ant-design/icons";
import TooltipContent from "../../PageComponents/TooltipContent/TooltipContent";
import {
  Tooltip,
} from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import { stakingAddress, WETH, factoryAddress, Zero, QswapTokenAddress, QswapTokenDecimals, lpTokenDecimals, dataTemp, LpTemp } from "../../constant/constant.js";


let poolInfo = [];
let poolLength = 0;
let StakeData = [];

const userSelectedList = [];

function Staking() {
  const walletProvider = new quais.BrowserProvider(window.pelagus);
  const [messageApi, contextHolder] = message.useMessage();
  const chainId = useChainId();
  const [gridView, setGridView] = useState(false);
  const [QuaiAndToken, setQuaiAndToken] = useState(false);
  const [searchString, setSearchString] = useState("");
  const { address, isConnected } = useAccount();
  const [allocPoint, setAllocPoint] = useState(100);
  const [lpAddress, setLpAddress] = useState(0);
  const [depositFeeBP, setDepositFeeBP] = useState(0);
  const [withUpdate, setWithUpdate] = useState(false);
  const [isOwner, SetOwner] = useState(false);
  const [listLPofContract, setLPlistofContract] = useState([])
  //  const { RPCProvider, error } = useQuaisProvider(chainId);
  //  if (error != null) {
  //      console.log('error', error)
  //  }
  // const RPCProvider = new quais.JsonRpcProvider('https://rpc.quai.network', undefined, { usePathing: true })


  let token0Icon;
  let token1Icon;

  const [stateStakeLPModal, setStateStakeLPModal] = useState(false);
  const [selectLPModal, setSelectLPModal] = useState(false);
  const [selectAddPoolModal, setSelectAddPoolModal] = useState(false);

  const [stakeType, setStakeType] = useState("Stake");
  const [QswapBalance, setQswapBalance] = useState('0');
  const [QswapAmount, setQswapAmount] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [isLPloading, setLPLoading] = useState(false)
  const [LpList, setLpList] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0)
  const [bConfirmButton, setConfirmButton] = useState(false)
  const [bAddPoolConfirmButton, setAddPoolConfirmButton] = useState(false)
  const [indexPool, setIndexPool] = useState(-1)
  const { data, isError, isLoading, refetch } = useBalance({
    address: address,
    token: QswapTokenAddress,
  });
  const [PoolData, SetFarmPoolData] = useState([]);

  const handleStakeLPModalCancel = () => {
    setStateStakeLPModal(false)
  }
  const HandleModalCancel = () => {
    userSelectedList.splice(0, userSelectedList.length)
    setSelectedCount(userSelectedList.length)
    setSelectLPModal(false)
  }

  useEffect(() => {
    if (selectedCount > 0)
      setConfirmButton(true)
    else
      setConfirmButton(false)
    setSelectedCount(userSelectedList.length)
    if (indexPool !== -1)
      setAddPoolConfirmButton(true)
  }, [selectedCount, userSelectedList, indexPool])

  const getQswapBalance = async () => {
    try {
      let amount = 0;
      if (data != undefined) {
        amount = quais.formatUnits(data.value, QswapTokenDecimals);
        setQswapBalance(amount);
        console.log('Updated LP Balance = ', amount);
      }
      return amount;
    } catch (e) {
      console.log('getLpBalance error : ', e);
    }
  }
  useEffect(() => {
    getQswapBalance()
    const checkOwner = async () => {
      try {

        if (address === Zero) {
          console.error('Invalid address:', address);
          SetOwner(false)
        }
        // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
        // const owner = await masterchefContract.owner();
        const owner = await readContract(wagmiConfig, {
          address: stakingAddress,
          abi: stakingABI.abi,
          functionName: "owner"
        })
        console.log('owner', owner, address)
        if (address === owner)
          SetOwner(true)
        else
          SetOwner(false)
      } catch (e) {
        console.log('check owner error : ', e);
      }
    }
    checkOwner();
  }, [isConnected, data]);



  const handleStaking = async () => {
    try {
      const signer = await walletProvider.getSigner();
      const staking = new quais.Contract(stakingAddress, stakingABI.abi, signer);
      const qswapContract = new quais.Contract(
        quais.getAddress(QswapTokenAddress),
        erc20ABI,
        signer,
      );
      if (stakeType === "Stake") {
        if (userSelectedList.length <= 0) {
          messageApi.warning('You have to select Pairs')
          return
        }
        const allowance = await qswapContract.allowance(address, stakingAddress);
        console.log('allowance', allowance)
        if (allowance != quais.MaxUint256) {
          let hide = messageApi.loading("Approving Qswap to StakingContract... ⏰", 0); // 0 means the message stays until manually hidden
          try {
            const tx = await qswapContract.approve(stakingAddress, quais.MaxUint256);
            if (tx) await tx.wait();
            hide()
            messageApi.success("Approved Successfully! 😀")
            console.log(`{qswap approved from ${address} to ${stakingAddress}}`)
          } catch (e) {
            if (hide) hide()
            messageApi.error("Approve failed! 😡")
            console.log(e)
          }
        }

        let hide = messageApi.loading("Staking Qswap token... ⏰", 0); // 0 means the message stays until manually hidden
        try {
          console.log("Staking....😊", quais.parseQuai(QswapAmount), userSelectedList, data.value)
          const usertx = await staking.userInfo(0, address)
          console.log('userInfo..😊..', usertx)

          const poolLen = await staking.poolLength()
          console.log('poolLen..😊..', poolLen)
          for (let i = 0; i < poolLen; i++) {
            const pooltx = await staking.poolInfo(i)
            console.log('poolInfo..😊..', pooltx)
          }

          const tx = await staking.stake(userSelectedList, quais.parseQuai(QswapAmount), QuaiAndToken);
          console.log(tx)
          if (tx) await tx.wait();
          hide()
          messageApi.success("Staked Successfully! 😀")
          // await getQswapStakedBalance()
        } catch (e) {
          if (hide) hide()
          messageApi.error("Staking failed! 😡")
          console.log(e)
        }
      }
      else if (stakeType === "Unstake") {
        let hide = messageApi.loading("UnStaking Qswap token... ⏰", 0); // 0 means the message stays until manually hidden
        try {
          console.log("Unstaking....😊", quais.parseQuai(QswapAmount))
          const tx = await staking.withdraw(userSelectedList[0], quais.parseQuai(QswapAmount), QuaiAndToken);
          console.log(tx)
          if (tx) await tx.wait();
          hide()
          messageApi.success("UnStaked Successfully! 😀")
          // await getQswapStakedBalance()
        } catch (e) {
          if (hide) hide()
          messageApi.error("UnStaking failed! 😡")
          console.log(e)
        }
      }

    }
    catch (e) {
      console.log(e)
    }
  }

  const getQswapStakedBalance = async (poolID) => {
    try {
      if (address === Zero || address === undefined) {
        console.log('Invalid address:', address);
        return 0;
      }
      const signer = await walletProvider.getSigner();

      const userINfO = await readContract(wagmiConfig, {
        address: stakingAddress,
        abi: stakingABI.abi,
        functionName: "userInfo",
        args: [poolID, address]
      })
      console.log('getQswapStakedBalance', userINfO[0])
      const balance = quais.formatUnits(userINfO[0], QswapTokenDecimals);
      // if (Number(amount) > 0) {
      //   const addresses = Object.values(selectedPairs).filter(value => typeof value === 'string');
      //   userSelectedList.splice(0, userSelectedList.length)
      //   addresses.map((item) => {
      //     userSelectedList.push(item)
      //   })
      // }
      // else {
      //   userSelectedList.splice(0, userSelectedList.length)
      // }
      // console.log('getUserInfo', userSelectedList, amount)
      setStakedBalance(balance);
      return balance;
    } catch (e) {
      console.log('getLpStakedBalance error : ', e);
    }
    return 0;
  }
  const modifyLPs = (index) => {
    let nLimit = stakeType === 'Stake' ? 5 : 1;
    let bRepeat;
    userSelectedList.map((item, i) => {

      if (item == index) {
        userSelectedList.splice(i, 1)
        bRepeat = true
        return;
      }
    })
    if (bRepeat) {
      bRepeat = false;
      setSelectedCount(userSelectedList.length)
      return;
    }
    if (selectedCount >= nLimit) {
      if (stakeType === 'Stake')
        messageApi.warning("You can have LP list less than 5 to stake")
      else if (stakeType === 'Unstake')
        messageApi.warning("You can have LP list less than 1 to withdraw")
      else
        messageApi.warning("You can have LP list less than 1 to Harvest")
      return;
    }
    userSelectedList.push(index)
    console.log('userSelectedList', userSelectedList)
    setSelectedCount(userSelectedList.length)
  }
  const modifyAddPool = (index) => {
    if (indexPool < 0 && indexPool > 1) {
      messageApi.warning("You can Select only 1 Pool")
      return;
    }
    setIndexPool(index)
  }
  const handleHarvesting = async () => {
    const signer = await walletProvider.getSigner();
    const staking = new quais.Contract(stakingAddress, stakingABI.abi, signer);
    let hide = messageApi.loading("Harvesting... ⏰", 0); // 0 means the message stays until manually hidden
    try {
      const tx = await staking.withdraw(userSelectedList[0], 0, QuaiAndToken);
      if (tx) await tx.wait();
      hide()
      messageApi.success("Harvest Successfully! 😀")
    } catch (e) {
      if (hide) hide()
      messageApi.error("Harvest failed! 😡")
      console.log(e)
    }
  }
  const GetAllPairs = async (pooldata) => {
    setLPLoading(true)

    let pairs = await FetchUserLiquidity(stakingAddress)
    console.log('pairs pairs', pairs)
    let tokenList = await FetchTokenList()
    tokenList?.map((itemToken) => {
      pairs.map((itemPair) => {
        if (itemPair.token0.symbol === itemToken.symbol) {
          itemPair.token0.img = itemToken.img;
        }
        if (itemPair.token1.symbol === itemToken.symbol) {
          itemPair.token1.img = itemToken.img;
        }
      })
    })
    setLpList(pairs)
    const pairTemp = [];
    console.log('setLPlistofContract', pooldata)
    pooldata.map((pool, index) => {
      pairs.map((pair, i) => {
        console.log('setLPlistofContract : LpList', pair)
        if (pool.lpTokenAddress.toLowerCase() === pair.address.toLowerCase())
          pairTemp.push(pair)
      })
    })
    console.log('setLPlistofContract : pairTemp', pairTemp)
    setLPlistofContract(pairTemp)
    setLPLoading(false)
  }

  const tokenPriceWithQuai = async (tokenAddress) => {
    try {
      if (tokenAddress === WETH)
        return 1;
      // const factoryContract = new quais.Contract(factoryAddress, factoryABI, RPCProvider)
      // const pairAddress = await factoryContract.getPair(WETH, tokenAddress)
      const result = await readContract(wagmiConfig, {
        address: factoryAddress,
        abi: factoryABI,
        functionName: "getPair",
        args: [WETH, tokenAddress]
      })
      // const pairAddress = result[0]
      console.log('tokenPriceWithQuai11', result)
      const pairAddress = result;
      if (pairAddress === Zero) {
        return 0;
      }
      const calls = [
        {
          address: pairAddress,
          abi: pairABI,
          functionName: "token0"
        },
        {
          address: pairAddress,
          abi: pairABI,
          functionName: "getReserves"
        },
      ];
      const results = await multicall(wagmiConfig, {
        contracts: calls
      })
      console.log("multi2222", results)
      const token0 = results[0].status === "success" ? results[0].result : Zero;
      const [reserveIn, reserveOut] = results[1].status === "success" ? results[1].result : Zero;

      let rate;
      if (token0 === WETH)
        rate = Number(reserveIn) / Number(reserveOut);
      else
        rate = Number(reserveOut) / Number(reserveIn);
      console.log('reserveIn, ', reserveIn, 'reserveOut', reserveOut, 'rate : ', rate);
      return rate;
    } catch (e) {
      console.log('tokenPriceWithQuai error: ', e)
    }
  }

  const FetchPoolListData = async () => {
    try {
      const ListToken = await FetchTokenList()
      const calls = [
        {
          address: stakingAddress,
          abi: stakingABI.abi,
          functionName: "poolLength",
        },
      ];
      const results = await multicall(wagmiConfig, { contracts: calls });

      poolLength = results[0].status === "success" ? results[0].result : 1;
      console.log('fetchfarmlist')
      let i = 0;
      let token0PricewithQuai;
      let token1PricewithQuai;
      let cntEnableUNSTAKE = 0, stakedBal;
      for (i = 0; i < Number(poolLength); i++) {

        if (cntEnableUNSTAKE !== 1)
          stakedBal = await getQswapStakedBalance(i);
        if (stakedBal > 0)
          cntEnableUNSTAKE = 1;

        const poolTemp = await readContract(wagmiConfig, {
          address: stakingAddress,
          abi: stakingABI.abi,
          functionName: "poolInfo",
          args: [i]
        })
        console.log(`${i}th pool addr = ${poolTemp[0]}`);
        const lpTokenAddr = poolTemp[0];
        console.log("multicall", lpTokenAddr)
        const calls = [
          {
            address: lpTokenAddr,
            abi: pairABI,
            functionName: "totalSupply"
          },
          {
            address: lpTokenAddr,
            abi: pairABI,
            functionName: "balanceOf",
            args: [stakingAddress]
          },
          {
            address: lpTokenAddr,
            abi: pairABI,
            functionName: "token0"
          },
          {
            address: lpTokenAddr,
            abi: pairABI,
            functionName: "token1"
          },
          {
            address: lpTokenAddr,
            abi: pairABI,
            functionName: "getReserves"
          },
        ]

        const results = await multicall(wagmiConfig, {
          contracts: calls
        })
        console.log('results', results)
        let totalSupply = results[0].result;
        let farmTotalSupply = results[1].result;
        const token0Addr = results[2].result;
        const token1Addr = results[3].result;
        const [reserve0, reserve1] = results[4].result;

        totalSupply = Number(quais.formatUnits(totalSupply, lpTokenDecimals));
        farmTotalSupply = Number(quais.formatUnits(farmTotalSupply, lpTokenDecimals));
        console.log('lp total supply = ', totalSupply, 'lp total supply in farm = ', farmTotalSupply);
        console.log('Token0 Addr = ', token0Addr);
        let token0Contract;
        let token0Decimals = 0;
        let token0Name = "";
        if (token0Addr === WETH) {
          token0Decimals = 18;
          token0Name = "WQUAI";
        }
        else {
          const calls = [
            {
              address: token0Addr,
              abi: erc20ABI,
              functionName: "decimals",
            },
            {
              address: token0Addr,
              abi: erc20ABI,
              functionName: "symbol",
            },
          ];
          const results = await multicall(wagmiConfig, { contracts: calls });
          token0Decimals = results[0].status === "success" ? results[0].result : 18;
          token0Name = results[1].status === "success" ? results[1].result : "Unknown Symbol";
        }

        console.log('Token1 Addr = ', token1Addr);
        let token1Contract;
        let token1Decimals;
        let token1Name = "";
        if (token1Contract === WETH) {
          token1Decimals = 18;
          token1Name = "WQUAI";
        }
        else {
          const calls = [
            {
              address: token1Addr,
              abi: erc20ABI,
              functionName: "decimals",
            },
            {
              address: token1Addr,
              abi: erc20ABI,
              functionName: "symbol",
            },
          ];
          const results = await multicall(wagmiConfig, { contracts: calls });
          console.log("multimulti", results)
          token1Decimals = results[0].status === "success" ? results[0].result : 18;
          token1Name = results[1].status === "success" ? results[1].result : "Unknown Symbol";
        }

        console.log('token names = ', token0Name, token1Name);

        if (token0Name === 'WQUAI')
          token0Icon = tokenList.QUAI.img;
        else if (token0Name === 'QSWAP')
          token0Icon = tokenList.QSWAP.img;
        else
          token0Icon = tokenImg;
        ListToken?.map((item) => {
          if (item.symbol === token0Name) {
            console.log('Token0Img', item.symbol, token0Name, item.img)
            token0Icon = item.img; return;
          }
        })


        if (token1Name === 'WQUAI')
          token1Icon = tokenList.QUAI.img;
        else if (token1Name === 'QSWAP')
          token1Icon = tokenList.QSWAP.img;
        else
          token1Icon = tokenImg;

        ListToken?.map((item) => {
          if (item.symbol === token1Name) {
            console.log('Token1Img', item.symbol, token1Name, item.img)
            token1Icon = item.img; return;
          }
        })

        let tokenName = "";
        if (token0Contract === WETH)
          tokenName = token0Name + "-" + token1Name;
        else if (token1Contract === WETH)
          tokenName = token1Name + "-" + token0Name;
        else
          tokenName = token0Name + "-" + token1Name;

        token0PricewithQuai = await tokenPriceWithQuai(token0Addr);
        token1PricewithQuai = await tokenPriceWithQuai(token1Addr);

        console.log('reserve0, ', reserve0, 'reserve1', reserve1, 'token0PricewithQuai', token0PricewithQuai, 'token1PricewithQuai', token1PricewithQuai);
        const token0Price = Number(quais.formatUnits(reserve0, token0Decimals)) * token0PricewithQuai;
        const token1Price = Number(quais.formatUnits(reserve1, token1Decimals)) * token1PricewithQuai;
        console.log('token0Price', token0Price, 'token1Price', token1Price);
        const lpTokenPrice = (token0Price + token1Price) / totalSupply;
        console.log('Lp Token Price = ', lpTokenPrice);

        let earned = 0;
        if (isConnected) {
          if (address === Zero) {
            earned = 0;
          } else {
            // earned = await masterchefContract.pendingQSWAP(i + 1, address);
            earned = await readContract(wagmiConfig, {
              address: stakingAddress,
              abi: stakingABI.abi,
              functionName: "pendingReward",
              args: [i, address],
            });
            earned = Number(quais.formatUnits(earned, lpTokenDecimals));
          }
        } else {
          earned = 0;
        }
        console.log('accLPperShare', poolTemp[1])
        console.log('lastLPbalanceOfPool', poolTemp[2])
        const stakedBalance = quais.formatQuai(poolTemp[3], QswapTokenDecimals);
        console.log('lastStakedbalanceOfPool', stakedBalance)
        poolInfo[i] = {
          earned: earned,
          stakedLiquidity: farmTotalSupply * lpTokenPrice,
          lpToken: poolTemp[0],          // Address of LP token contract.
          lpTokenPrice: lpTokenPrice,         // LP Token Price with Quai
          accLPperShare: poolTemp[1],    // How many allocation points assigned to this pool. OVEs to distribute per block.
          lastLPbalanceOfPool: poolTemp[2],// Last block number that OVEs distribution occurs.
        }

        console.log(`PoolList = ${i}th liquidity`, poolInfo[i]);

        StakeData[i] = {
          icon: token0Icon,
          image: token1Icon,
          lpEarned: earned,
          liquidity: poolInfo[i].stakedLiquidity,
          contractUrl: `https://quaiscan.io/address/${stakingAddress}`,
          getUrl: "https://quaiswap.io/liquidity",
          pairInfoUrl: `https://info.quaiswap.io/pair/${lpTokenAddr}`,
          name: tokenName,
          lpTokenAddress: lpTokenAddr,
          lpTokenPrice: lpTokenPrice,
          pid: i,
          stakedBalance: stakedBalance
        }
        console.log('pooldata', StakeData)
      }
      await GetAllPairs(StakeData);
      SetFarmPoolData(StakeData);
    } catch (e) {

    }
  }
  useEffect(() => {
    FetchPoolListData();
  }, [])

  const setMaxAmount = async () => {
    try {
      let amount = 0;
      if (stakeType === "Stake") {
        amount = quais.formatUnits(data.value, QswapTokenDecimals);
        console.log('.😊', amount, data.value)
        setQswapAmount(amount);
      } else if (stakeType === "Unstake") {
        setQswapAmount(stakedBalance);
      }
    } catch (e) {
      console.log('setMaxAmount error: ', e);
    }

  }
  const checkConfirm = () => {
    if (stakeType === "Stake") {
      if (Number(QswapAmount) <= 0 || Number(QswapAmount) > Number(QswapBalance)) {
        return false;
      }
    } else if (stakeType === "Unstake") {
      if (Number(QswapAmount) <= 0 || Number(QswapAmount) > stakedBalance) {
        return false;
      }
    }

    return true;
  }

  const handleStake = async () => {
    setStakeType("Stake");
    // if (stakedBalance > 0)           // If user already staked to contract with any pairs, can only stake until unstaked all, can't change pair.
    //   setStateStakeLPModal(true)
    // else                                 
    setSelectLPModal(true);
  }
  const handleHarvest = async () => {
    setStakeType("Harvest");
    setSelectLPModal(true);
  }
  const handleUnStake = async () => {
    setStakeType("Unstake");
    setSelectLPModal(true);
  }
  const handleLP = async () => {
    setSelectLPModal(false)
    if (stakeType === "Harvest") {
      handleHarvesting()
      return;
    }
    getQswapStakedBalance(userSelectedList[0])
    setStateStakeLPModal(true);
  }
  const handleAddPool = async () => {
    const signer = await walletProvider.getSigner();
    const staking = new quais.Contract(stakingAddress, stakingABI.abi, signer);
    let hide = messageApi.loading("Adding Pool... ⏰", 0); // 0 means the message stays until manually hidden
    try {
      const tx = await staking.add(LpList[indexPool].address, false);
      if (tx) await tx.wait();
      hide()
      messageApi.success("New Pool is Added  Successfully! 😀")
    } catch (e) {
      if (hide) hide()
      messageApi.error("Adding Pool failed! 😡")
      console.log(e)
    }
  }
  return (
    <div className={styles.mainCont}>
      {contextHolder}
      {
        <Modal open={stateStakeLPModal} footer={null} onCancel={handleStakeLPModalCancel} title={`${stakeType} QSWAP token`}>
          <div className='container'>
            <div className='stake-balance-title'>
              <label>
                {stakeType}
              </label>
              {
                stakeType === "Stake" ? (
                  <label>
                    Balance: {QswapBalance}
                  </label>
                ) : (
                  <label>
                    StakedBalance: {stakedBalance}
                  </label>
                )
              }

            </div>

            <div className='stake-balance-box'>
              <div className='stake-balance'>
                <input
                  placeholder="0"
                  className="input-custom"
                  value={QswapAmount}
                  onChange={(e) => setQswapAmount(e.target.value)}
                />
                {/* USD */}
              </div>
              <button className='max-button' onClick={() => {
                setMaxAmount();
              }}>
                MAX
              </button>
              <div className='stake-label'>
                {/* {name} */}
              </div>
            </div>

            <div className="btn-box">
              <button className='enableBtn' onClick={() => { setStateStakeLPModal(false); }}>Cancel</button>
              {
                checkConfirm() === true ? (
                  <button className='enableBtn' onClick={() => {
                    handleStaking();
                  }}>Confirm</button>
                ) : (
                  <button className='disableBtn'>Confirm</button>
                )
              }

            </div>
          </div>
        </Modal >
      }
      {
        <Modal open={selectAddPoolModal} footer={<div className={styleRow.harvestRow}><button className={bAddPoolConfirmButton ? styleRow.harvestEnable : styleRow.harvestDisable} disabled={bAddPoolConfirmButton ? false : true} onClick={() => handleAddPool()}>Confirm</button></div>} onCancel={() => setSelectAddPoolModal(false)} title={<div style={{ display: "flex", justifyContent: "space-between" }}> <p>Select a Pool to Add by Owner</p><p style={{ marginRight: "50px" }}></p></div>}>
          <div className="modalContent">
            {(LpList?.map((item, index) => (
              <div className={index === indexPool ? "tokenChoice-enable" : "tokenChoice"} key={index} onClick={() => { modifyAddPool(index); console.log('indexPool', indexPool) }}>
                <div className="left-choice">
                  <div style={{ display: 'flex' }}>
                    <div className="tokenChoiceNames">
                      <div className="tokenNameLeft">{item.token0.name}</div>
                      <div className="tokensymbolLeft">{item.token0.symbol}</div>
                    </div>
                    <img src={item.token0.img} alt={item.token0.symbol} className="tokenLogo" /></div>
                </div>
                <div className="right-choice">
                  <img src={item.token1.img} alt={item.token1.symbol} className="tokenLogo" />
                  <div className="tokenChoiceNames">
                    <div className="tokenName">{item.token1.name}</div>
                    <div className="tokensymbol">{item.token1.symbol}</div>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </Modal>
      }
      {
        <Modal open={selectLPModal} footer={<div className={styleRow.harvestRow}><button className={bConfirmButton ? styleRow.harvestEnable : styleRow.harvestDisable} disabled={bConfirmButton ? false : true} onClick={() => handleLP()}>Confirm</button></div>} onCancel={HandleModalCancel} title={<div style={{ display: "flex", justifyContent: "space-between" }}> <p>Select a LPs to get Reward</p><p style={{ marginRight: "50px" }}>{selectedCount}</p></div>}>
          <div className="modalContent">
            {(listLPofContract?.map((item, index) => (
              <div className={userSelectedList.indexOf(index) !== -1 | undefined ? "tokenChoice-enable" : "tokenChoice"} key={index} onClick={() => { modifyLPs(index) }}>
                <div className="left-choice">
                  <div style={{ display: 'flex' }}>
                    <div className="tokenChoiceNames">
                      <div className="tokenNameLeft">{item.token0.name}</div>
                      <div className="tokensymbolLeft">{item.token0.symbol}</div>
                    </div>
                    <img src={item.token0.img} alt={item.token0.symbol} className="tokenLogo" /></div>
                </div>
                <div className="right-choice">
                  <img src={item.token1.img} alt={item.token1.symbol} className="tokenLogo" />
                  <div className="tokenChoiceNames">
                    <div className="tokenName">{item.token1.name}</div>
                    <div className="tokensymbol">{item.token1.symbol}</div>
                  </div>
                </div>
              </div>
            )))}
          </div>

        </Modal>
      }

      <div className={styles.headCont}>
        <div className={styles.head}>
          {/* <h1>Farms</h1> */}
          <p>Stake QSWAP tokens to earn LP.</p>
        </div>
      </div>
      {isOwner && <button className='enableBtn' style={{ marginBottom: '10px' }} onClick={() => {
        setSelectAddPoolModal(true);
      }}>Add Pool</button>}
      <div className={styleRow.headerDiv}>
        <div className={styleRow.earnedDiv}>
          <div className={styleRow.earnRow}>

            {/* {filter header starts here-----------------------------------------------} */}
            <div className={stylesHeader.auctionHeader}>
              <div className={stylesHeader.rightAuction}>
                <div className={stylesHeader.toggleSwitch}>
                  <p>LP</p>
                  <input type="checkbox" id="switch" onChange={(e) => {
                    setQuaiAndToken(!QuaiAndToken)
                  }}
                  />
                  <label htmlFor="switch">Toggle</label>
                  <p>Quai + Token</p>
                </div></div></div>
            <gap style={{ width: "20px" }}></gap>
            {/* <div className={styleRow.headerInfo}>
              <div className={styleRow.headerInfo1}>
                <h3>StakedBalance:</h3>
                <h3>TotalStakedBalance:</h3>
              </div>
              <div className={styleRow.headerInfo2}>
                <h3>1231231231</h3>
                <h3>3131321231</h3>
              </div>

            </div> */}
            <gap style={{ width: "20px" }}></gap>
            {/* {filter header ends here-----------------------------------------------} */}
            <div className={styles.buttonRow}>
              <gap style={{ width: "20px" }}></gap>
              <button className={stakedBalance > 0 ? styleRow.harvestEnable : styleRow.harvestDisable} disabled={stakedBalance > 0 ? false : true} onClick={() => handleHarvest()
              }>HARVEST</button>
            </div>
          </div>
        </div>
        <gap style={{ width: "20px" }}></gap>
        <div className={styleRow.earnedDiv}>
          <div className={styleRow.earnRow}>
            {/* {filter header ends here-----------------------------------------------} */}
            <div className={styles.buttonRow} style={{ display: "flex", justifyContent: "space-around" }}>
              <gap style={{ width: "20px" }}></gap>
              <button className={styleRow.harvestEnable} onClick={() => {
                handleStake()
              }}>STAKE</button>
              <gap style={{ width: "20px" }}></gap>
              <button className={stakedBalance > 0 ? styleRow.harvestEnable : styleRow.harvestDisable} disabled={stakedBalance > 0 ? false : true} onClick={() => {
                handleUnStake()
              }}>UNSTAKE</button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.auctionDiv}>
        <div
          className={styles.farmRowCont}
        >
          {PoolData.map((item) => {
            return gridView ? (
              <StakeBox {...item} />
            ) : (
              <StakeRow {...item} />
            );
          }
          )}
          <div
            onClick={() => window.scroll(0, 0)}
            className={`${styles.toTop} ${gridView && styles.topChange}`}
          >
            To Top <FontAwesomeIcon icon={faChevronUp} />{" "}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Staking;
