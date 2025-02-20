import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

import styles from "./styles/Farms.module.css";
import FilterHeader from "../../PageComponents/FilterHeader/FilterHeader";
import smallIco from "../../assets/bnb.svg";
import small from "../../assets/small-ico.svg";
import FarmRow from "../../PageComponents/FarmRow/FarmRow";
import FarmBox from "../../PageComponents/FarmBox/FarmBox";
import { useAccount, useChainId, useBalance, useReadContract } from "wagmi";
import masterchefABI from "../../assets/abi/IMasterChef.json";
import { quais } from 'quais'
import factoryABI from "../../assets/abi/IUniswapV2Factory.json";
import pairABI from "../../assets/abi/ILiquidity.json";
import erc20ABI from "../../assets/abi/IERC20.json";
import wethABI from "../../assets/abi/IETH.json";
import tokenImg from "../../assets/img/tokenquestion.png";
import { Modal, Input, message, Slider } from "antd";
import wagmiConfig from "../../util/wagmiconfig.js";
import { readContract, multicall } from "@wagmi/core";
import { FetchTokenList } from "../../assets/FetchtokenList.js";
import { masterchefAddress, WETH, factoryAddress, Zero, lpTokenDecimals, tokenList } from "../../constant/constant.js";

let poolInfo = [];
let poolLength = 0;
let FarmData = [];

function Farms() {
  const walletProvider = new quais.BrowserProvider(window.pelagus);
  const [messageApi, contextHolder] = message.useMessage();
  const chainId = useChainId();
  const [gridView, setGridView] = useState(false);
  const [stakeOnly, setStakeOnly] = useState(false);
  const [searchString, setSearchString] = useState("");
  const { address, isConnected } = useAccount();
  const [allocPoint, setAllocPoint] = useState(100);
  const [lpAddress, setLpAddress] = useState(0);
  const [depositFeeBP, setDepositFeeBP] = useState(0);
  const [withUpdate, setWithUpdate] = useState(false);
  //  const { RPCProvider, error } = useQuaisProvider(chainId);
  //  if (error != null) {
  //      console.log('error', error)
  //  }
  // const RPCProvider = new quais.JsonRpcProvider('https://rpc.quai.network', undefined, { usePathing: true })
  

  const [data, SetFarmPoolData] = useState([]);
  let token0Icon;
  let token1Icon;
  const [openAddFarmModal, setOpenAddFarmModal] = useState(false);
  const [isOwner, SetOwner] = useState(false);
  const [refetch, setRefetch] = useState(false)
  useEffect(() => {
    const timerID = setInterval(() => {
      setRefetch((prevData) => {
        return !prevData;
      })
    }, 60000);
    return () => {
      clearInterval(timerID);
    };
  }, []);
  useEffect(() => {
    const checkOwner = async () => {
      try {

        if (address === Zero) {
          console.error('Invalid address:', address);
          SetOwner(false)
        }
        // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
        // const owner = await masterchefContract.owner();
        const owner = await readContract(wagmiConfig, {
          address: masterchefAddress,
          abi: masterchefABI,
          functionName: "owner"
        })
        console.log('owner', owner)
        if (address === owner)
          SetOwner(true)
        else
          SetOwner(false)
      } catch (e) {
        console.log('check owner error : ', e);
      }
    }
    checkOwner();
  }, [isConnected])

  const getLpStakedBalance = async (pid) => {
    try {

      console.log('getLpStakeBalance address= ', address, pid);
      if (address === Zero || pid === undefined) {
        console.error('Invalid address:', address);
        return 0;
      }
      // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
      // const userInfo = await masterchefContract.userInfo();
      const userInfo = await readContract(wagmiConfig, {
        address: masterchefAddress,
        abi: masterchefABI,
        functionName: "userInfo",
        args: [pid, address]
      })
      const balance = Number(quais.formatUnits(userInfo[0], lpTokenDecimals));
      console.log('My Wallet addr = ', address, 'Lp Balance = ', balance);
      return balance;
    } catch (e) {
      console.log('getLpStakedBalance on Farms.js error : ', e);
    }
    return 0;
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
      // const token0 = await pairContract.token0();
      // const pairContract = new quais.Contract(pairAddress, pairABI, RPCProvider)
      // const [reserveIn, reserveOut] = await pairContract.getReserves()
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

  const fetchFarmList = async () => {
    try {
      const ListToken = await FetchTokenList()
      // const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, RPCProvider);
      // console.log('Masterchef = ', masterchefContract);
      // // Use Multicall
      // poolLength = await masterchefContract.poolLength();
      // let qswapPerBlock = await masterchefContract.qswapPerBlock();
      // const totalAllocPoint = await masterchefContract.totalAllocPoint();
      //................
      const calls = [
        {
          address: masterchefAddress,
          abi: masterchefABI,
          functionName: "poolLength",
        },
        {
          address: masterchefAddress,
          abi: masterchefABI,
          functionName: "qswapPerBlock",
        },
        {
          address: masterchefAddress,
          abi: masterchefABI,
          functionName: "totalAllocPoint",
        },
      ];
      const results = await multicall(wagmiConfig, { contracts: calls });

      poolLength = results[0].status === "success" ? results[0].result : 1;
      let qswapPerBlock = results[1].status === "success" ? results[1].result : 0.0000005;
      const totalAllocPoint = results[2].status === "success" ? results[2].result : 1000;
      console.log('fetchfarmlist')
      const blocksPerYear = 60 * 60 * 24 * 365 / 3; // blocks generate every 3 seconds
      let APR = Number(quais.formatUnits(qswapPerBlock, lpTokenDecimals)) * blocksPerYear;
      console.log('Farm List = ', APR);
      let i = 0;
      let token0PricewithQuai;
      let token1PricewithQuai;

      for (i = 0; i < Number(poolLength) - 1; i++) {
        // const poolTemp = await masterchefContract.poolInfo(i + 1);
        const poolTemp = await readContract(wagmiConfig, {
          address: masterchefAddress,
          abi: masterchefABI,
          functionName: "poolInfo",
          args: [i + 1]
        })
        console.log(`${i}th pool addr = ${poolTemp[0]}`);
        const multiplier = Number(poolTemp[1]) / 100;
        const lpTokenAddr = poolTemp[0];
        // const pairContract = new quais.Contract(lpTokenAddr, pairABI, RPCProvider);
        // Use Multicall
        // let totalSupply = await pairContract.totalSupply();
        // let farmTotalSupply = await pairContract.balanceOf(masterchefAddress);
        // const token0Addr = await pairContract.token0();
        // const token1Addr = await pairContract.token1();
        // const [reserve0, reserve1] = await pairContract.getReserves();
        //...............
        console.log("multicall", lpTokenAddr, masterchefAddress,)
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
            args: [masterchefAddress]
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
          // token0Contract = new quais.Contract(token0Addr, erc20ABI, RPCProvider);
          // token0Decimals = await token0Contract.decimals();
          // token0Name = await token0Contract.symbol();
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
          // token1Contract = new quais.Contract(token1Addr, erc20ABI, RPCProvider);
          // token1Decimals = await token1Contract.decimals();
          // token1Name = await token1Contract.symbol();
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
        console.log('2222222', token0Addr, token1Addr)
        token0PricewithQuai = await tokenPriceWithQuai(token0Addr);
        token1PricewithQuai = await tokenPriceWithQuai(token1Addr);

        console.log('reserve0, ', reserve0, 'reserve1', reserve1, 'token0PricewithQuai', token0PricewithQuai, 'token1PricewithQuai', token1PricewithQuai);
        const token0Price = Number(quais.formatUnits(reserve0, token0Decimals)) * token0PricewithQuai;
        const token1Price = Number(quais.formatUnits(reserve1, token1Decimals)) * token1PricewithQuai;
        console.log('token0Price', token0Price, 'token1Price', token1Price);
        const lpTokenPrice = (token0Price + token1Price) / totalSupply;
        console.log('Lp Token Price = ', lpTokenPrice);

        // APR = (Number(APR) * Number(poolTemp.allocPoint) / Number(totalAllocPoint)) * multiplier;
        // APR = Number(APR / (farmTotalSupply * lpTokenPrice)) * 100;

        let earned = 0;
        if (isConnected) {
          if (address === Zero) {
            earned = 0;
          } else {
            // earned = await masterchefContract.pendingQSWAP(i + 1, address);
            earned = await readContract(wagmiConfig, {
              address: masterchefAddress,
              abi: masterchefABI,
              functionName: "pendingQSWAP",
              args: [i + 1, address],
            });
            earned = Number(quais.formatUnits(earned, lpTokenDecimals));
          }
        } else {
          earned = 0;
        }
        console.log('allocPoint', poolTemp[1])
        poolInfo[i] = {
          earned: earned,
          multiplier: multiplier,
          stakedLiquidity: farmTotalSupply * lpTokenPrice,
          lpToken: poolTemp[0],          // Address of LP token contract.
          lpTokenPrice: lpTokenPrice,         // LP Token Price with Quai
          allocPoint: poolTemp[1],    // How many allocation points assigned to this pool. OVEs to distribute per block.
          totalAllocPoint: totalAllocPoint,
          lastRewardBlock: poolTemp[2],// Last block number that OVEs distribution occurs.
          accQswapPerShare: poolTemp[3], // Accumulated OVEs per share, times 1e12. See below.
          depositFeeBP: poolTemp[4],    // Deposit fee in basis points
          apr: APR, // Annual Percentage Rate
        }

        console.log(`PoolList = ${i}th liquidity`, poolInfo[i]);

        FarmData[i] = {
          icon: token0Icon,
          image: token1Icon,
          core: true,
          earned: earned,
          apr: poolInfo[i].apr,
          liquidity: poolInfo[i].stakedLiquidity,
          multiplier: poolInfo[i].multiplier.toString(),
          contractUrl: `https://quaiscan.io/address/${lpTokenAddr}`,
          getUrl: "https://quaiswap.io/liquidity",
          pairInfoUrl: `https://info.quaiswap.io/pair/${lpTokenAddr}`,
          cakeEarned: earned,
          name: tokenName,
          lpTokenAddress: lpTokenAddr,
          lpTokenPrice: lpTokenPrice,
          pid: i + 1,
          allocPoint: poolInfo[i].allocPoint,
          totalAllocPoint: totalAllocPoint,
          // RPCProvider: RPCProvider,
          // walletProvider: walletProvider
        }
      }
      SetFarmPoolData(FarmData);
    }
    catch (e) {
      console.log(e)
    }

  }
  useEffect(() => {
    fetchFarmList();
  }, [])

  const fetchStakedFarmList = async () => {
    try {
      console.log('fetching farm list1...');
      const poolLength = poolInfo.length;
      if (FarmData.length < poolLength || poolLength == 0) {
        console.log('Farm data error...', FarmData.length, poolLength);
        return;
      }
      if (!stakeOnly) {
        console.log('return old farm data...', FarmData.length, poolLength);
        SetFarmPoolData(FarmData);
        return;
      }
      console.log('step1...');
      let i = 0;
      let j = 0;
      let stakedFarmData = [];
      console.log('step2...', poolLength);
      for (i = 0; i < poolLength; i++) {
        const stakedBalance = await getLpStakedBalance(i + 1);
        console.log('step3...');
        if (stakedBalance > 0) {
          stakedFarmData[j] = FarmData[i];
          j++;
        }
        console.log('step4...');
      }
      console.log('step5...');
      SetFarmPoolData(stakedFarmData);
      console.log('step6...');
      console.log('fetching farm list2...');
    } catch (e) {
      console.log('fetchStakedFarmList error: ', e);
    }
  }
  useEffect(() => {
    console.log('changed staked only status...', stakeOnly);
    fetchStakedFarmList();
  }, [stakeOnly])

  const handleSearchFarm = () => {
    try {
      if (poolLength == 0) {
        console.log('farm data error...', poolLength);
        return;
      }
      console.log('step1...', searchString);
      let i = 0;
      let j = 0;
      console.log('step2...');
      let searchResult = [];
      for (i = 0; i < Number(poolLength) - 1; i++) {
        console.log('step3...', FarmData[i]);
        const farmName = FarmData[i].name;
        const contains = farmName.toLowerCase().includes(searchString.toLowerCase());
        console.log('step4...', contains);
        if (contains) {
          searchResult[j] = FarmData[i];
          j++;
        }
      }
      SetFarmPoolData(searchResult);
    } catch (e) {
      console.log('handleSearchFarm error...', e);
    }
  }

  useEffect(() => {
    console.log('changed search farm status...');
    handleSearchFarm();
  }, [searchString])

  const handleAddFarmModalCancel = () => {
    setOpenAddFarmModal(false);
  }

  const handleAddFarm = async () => {
    try {
      console.log('Handle Add farming...');
      const signer = await walletProvider.getSigner();
      const masterchefContract = new quais.Contract(masterchefAddress, masterchefABI, signer);
      const tx = await masterchefContract.add(allocPoint, lpAddress, depositFeeBP, withUpdate);
      if (tx)
        await tx.wait(1);
      messageApi.success("Added successfully!");

    } catch (e) {
      console.log('HandleAddFarm error : ', e);
    }
  }

  return (
    <div className={styles.mainCont}>
      {contextHolder}
      {
        <Modal open={openAddFarmModal} footer={null} onCancel={handleAddFarmModalCancel} title="Add Farm">
          <div className='container'>
            <div className='addfarm-box'>
              <div className='stake-label'>
                Alloc Point
              </div>
              <div className='addfarm'>
                <input
                  placeholder=""
                  className="input-custom"
                  value={allocPoint}
                  onChange={(e) => setAllocPoint(e.target.value)}
                />
              </div>
            </div>

            <div className='addfarm-box'>
              <div className='stake-label'>
                LP Token
              </div>
              <div className='addfarm'>
                <input
                  placeholder=""
                  className="input-custom"
                  value={lpAddress}
                  onChange={(e) => setLpAddress(e.target.value)}
                />
              </div>
            </div>

            <div className='addfarm-box'>
              <div className='stake-label'>
                Fee BP
              </div>
              <div className='addfarm'>
                <input
                  placeholder=""
                  className="input-custom"
                  value={depositFeeBP}
                  onChange={(e) => setDepositFeeBP(e.target.value)}
                />
              </div>
            </div>

            <div className='addfarm-box'>
              <div className='stake-label'>
                Update
              </div>
              <div className='addfarm'>
                <input
                  placeholder=""
                  className="input-custom"
                  value={withUpdate}
                  onChange={(e) => setWithUpdate(e.target.value)}
                />
              </div>
            </div>


            <div className="btn-box">
              <button className='enableBtn' onClick={() => { setOpenAddFarmModal(false); }}>Cancel</button>
              {
                <button className='enableBtn' onClick={() => {
                  handleAddFarm();
                }}>Confirm</button>
              }

            </div>
          </div>
        </Modal >
      }
      <div className={styles.headCont}>
        <div className={styles.head}>
          {/* <h1>Farms</h1> */}
          <p>Stake LP tokens to earn.</p>
          {
            isOwner && (
              <button className='enableBtn' onClick={() => {
                setOpenAddFarmModal(true);
              }}>Add Farm</button>
            )
          }
          {/* <Link to={"/Earn/Farm"}>
            Community Auctions <FontAwesomeIcon icon={faArrowRight} />
          </Link> */}
        </div>
      </div>
      <div className={styles.auctionDiv}>
        {/* {filter header starts here-----------------------------------------------} */}
        <FilterHeader
          setGridView={setGridView}
          setStakeOnly={setStakeOnly}
          setSearchString={setSearchString}
        />
        {/* {filter header ends here-----------------------------------------------} */}
        <div
          className={`${gridView ? styles.farmRowGrid : styles.farmRowCont}`}
        >
          {data.map((elem, key) => {
            return gridView ? (
              <FarmBox {...elem} key={key + "FarmRow"} />
            ) : (
              <FarmRow {...elem} key={key + "FarmRow"} />
            );
          })}
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

export default Farms;
