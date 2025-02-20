import React, { useState, useEffect, useRef, memo } from "react";
import { Button, Input, Popover, Radio, Modal, message } from "antd";
import {
    ArrowDownOutlined,
    DownOutlined,
    SettingOutlined,
} from "@ant-design/icons";
// import axios from "axios";
import { useReadContract, useChainId, useAccount } from "wagmi";
import { readContract, getBalance, multicall } from "@wagmi/core";
import { FetchTokenList } from "../assets/FetchtokenList.js";
import unknownToken from "../assets/img/tokenquestion.png";
import routerABI from "../assets/abi/IUniSwapV2Router02.json";
import factoryABI from "../assets/abi/IUniswapV2Factory.json";
import erc20ABI from "../assets/abi/IERC20.json";
import pairABI from "../assets/abi/ILiquidity.json";
import { quais } from 'quais'
import { useQuaisProvider } from "../util/provider";
import wagmiConfig from "../util/wagmiconfig.js";
import Chart from "./TradingView/chart.js";
import { tokenSupportsPermit, signEip2612Permit, isAllowanceNearInfinite } from "./Helpers.js";
import { ChartStatus, tokenTemp, tokenList, Pairs, pairStable, WETH, routerAddress, factoryAddress, Zero } from "../constant/constant.js";
/* global BigInt */


function Swap(props) {

    const chainId = useChainId();
    const { address, isConnected } = useAccount();
    const [messageApi, contextHolder] = message.useMessage();
    const [slippage, setSlippage] = useState(5);
    const [token1Amount, setToken1Amount] = useState("");
    const [token2Amount, setToken2Amount] = useState("");
    const [firstToken, setFirstToken] = useState(tokenList.QUAI);
    const [secondToken, setSecondToken] = useState(tokenList.QSWAP);
    const [searchedToken, setSearchedToken] = useState(tokenTemp);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [selectedToken, setSelectedToken] = useState(1);
    const [toggleFetchBalances, setToggleFetchBalances] = useState(false);
    const [isTokenSearch, setTokenSearch] = useState(false)
    const [isSell, setSell] = useState(true);
    const [balance1, setBalance1] = useState(null); // Token 1 balance
    const [balance2, setBalance2] = useState(null); // Token 2 balance
    const [searchTokenAddress, setSearcheTokenAddress] = useState('')
    const [ListToken, setTokenList] = useState([tokenTemp])
    const { walletProvider, error } = useQuaisProvider(chainId);
    const [pair, setPair] = useState(Pairs["QSWAP/QUAI"]) // QSWAP/QUAI pair
    const [isTokenFirst, setisTokenFirst] = useState(ChartStatus.notStable);
    const [token0forPair, setToken0ForPair] = useState(tokenList.QSWAP.symbol);
    const [token1forPair, setToken1ForPair] = useState(tokenList.QUAI.symbol);
    const [showChart, setShowChart] = useState(true); // false => hidden by default
    const container = useRef();
    if (error != null) {
        console.log('error', error)
    }

    if (error != null) {
        console.log('error', error)
    }

    useEffect(() => {
        (async () => {
            await sleep(1000)
            fetchBalances()
            changeToken1Amount(token1Amount)
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toggleFetchBalances])

    useEffect(() => {
        fetchBalances();
    }, [firstToken, secondToken, address, isConnected]);

    useEffect(() => {
        handleTokenList();
    }, [])

    const handleSlippage = (e) => {
        try {
            const number = Number(e);
            console.log('number', number);
            if (number <= 0 || number >= 100)
                return;
            setSlippage(number)
            console.log('slippage', slippage);
        }
        catch (e) { }
    }

    const fetchBalances = async () => {
        try {
            if (isConnected && address) {
                // Fetch balance for Token 1
                if (firstToken.address) {
                    if (firstToken.address.toLowerCase() === WETH.toLowerCase()) {
                        const balance = await getBalance(wagmiConfig, {
                            address: address
                        });
                        setBalance1(Number(balance.formatted).toFixed(4));
                    } else {
                        const balance = await getBalance(wagmiConfig, {
                            address: address,
                            token: firstToken.address
                        });
                        const balanceTruncated = truncateDecimals(balance.formatted, 4);
                        setBalance1(balanceTruncated);
                    }
                }

                // Fetch balance for Token 2
                if (secondToken.address) {
                    if (secondToken.address.toLowerCase() === WETH.toLowerCase()) {
                        const balance = await getBalance(wagmiConfig, {
                            address: address,
                        });
                        setBalance2(Number(balance.formatted).toFixed(4));
                    } else {
                        const balance = await getBalance(wagmiConfig, {
                            address: address,
                            token: secondToken.address
                        });
                        const balanceTruncated = truncateDecimals(balance.formatted, 4);
                        setBalance2(balanceTruncated);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    };

    const handleTokenList = async () => {
        let tokens = await FetchTokenList()
        console.log('handleFetch TokenList', tokens)
        setTokenList(tokens)
    }
    const getPairAddress = async (token0, token1) => {
        try {
            const calls = [
                {
                    address: factoryAddress, // Replace with your factory address
                    abi: factoryABI,
                    functionName: "getPair",
                    args: [token0, token1],
                },
            ];
            const results = await multicall(wagmiConfig, { contracts: calls });
            const pairAddress = results[0].status === "success" ? results[0].result : "0x0000000000000000000000000000000000000000";
            console.log('[Night]pairAddress', pairAddress)
            return pairAddress;
        }
        catch (e) {
            console.log(e)
        }
    }

    const getisTokenFirst = async (pairAddress, token0) => {
        try {
            let isStable = pairStable.includes(pairAddress.toLowerCase()) //pairStable must be consists with tolowercase of String for pairAddress

            console.log('chatStatus', isStable)

            const callToken = [
                {
                    address: pairAddress, // Replace with your pair address
                    abi: pairABI,
                    functionName: "token0",
                },
                {
                    address: pairAddress, // Replace with your pair address
                    abi: pairABI,
                    functionName: "token1",
                }
            ];

            const resultToken = await multicall(wagmiConfig, { contracts: callToken });
            const token0Address = resultToken[0].status === "success" ? resultToken[0].result : "";
            const token1Address = resultToken[1].status === "success" ? resultToken[1].result : "";

            const calls = [
                {
                    address: token0Address,
                    abi: erc20ABI,
                    functionName: "symbol",
                },
                {
                    address: token1Address,
                    abi: erc20ABI,
                    functionName: "symbol",
                }
            ];
            const results = await multicall(wagmiConfig, { contracts: calls });
            const token0symbol = results[0].status === "success" ? results[0].result : "Unknown Name";
            const token1symbol = results[1].status === "success" ? results[1].result : "Unknown Name";

            setToken0ForPair(token0symbol);
            setToken1ForPair(token1symbol);
            if (token1Address.toLowerCase() === WETH.toLowerCase()) {
                setToken0ForPair(token0symbol);
                setToken1ForPair(token1symbol);
            }
            if (token0Address.toLowerCase() === WETH.toLowerCase()) {
                setToken0ForPair(token1symbol);
                setToken1ForPair(token0symbol);
            }

            console.log('[Night]token0', token0Address, token0)

            if (isStable) {
                if (token0Address?.toLowerCase() === token0?.toLowerCase())
                    return ChartStatus.isFirstToken
                else
                    return ChartStatus.isSecondToken
            } else {
                let status = ChartStatus.notStable;
                if (token0Address?.toLowerCase() === WETH.toLowerCase())
                    status = ChartStatus.isSecondToken
                if (token1Address?.toLowerCase() === WETH.toLowerCase())
                    status = ChartStatus.isFirstToken
                return status;
            }


        } catch (e) {
            console.log(e)
        }
    }

    const handleTokenBalanceClick = (tokenIndex) => {
        if (tokenIndex === 1 && balance1) {
            changeToken1Amount(balance1);
        } else if (tokenIndex === 2 && balance2) {
            changeToken2Amount(balance2);
        }
    };

    const HandleTokenAddress = async (e) => {
        try {
            setSearcheTokenAddress(e)
            let address = quais.getAddress(e)
            console.log('handleTokenSearch', address);
            if (quais.isAddress(address)) {
                if (WETH.toLowerCase() === address.toLowerCase())
                    setSearchedToken(tokenList[0])
                else {
                    const calls = [
                        {
                            address: address,
                            abi: erc20ABI,
                            functionName: "name",
                        },
                        {
                            address: address,
                            abi: erc20ABI,
                            functionName: "symbol",
                        },
                        {
                            address: address,
                            abi: erc20ABI,
                            functionName: "decimals",
                        },
                    ];
                    const results = await multicall(wagmiConfig, { contracts: calls });
                    if (!results || results[0].status !== "success") {
                        setTokenSearch(false);
                        return;
                    }
                    const name = results[0].status === "success" ? results[0].result : "Unknown Name";
                    const symbol = results[1].status === "success" ? results[1].result : "Unknown Symbol";
                    const decimals = results[2].status === "success" ? results[2].result : 18; // Default to 18 decimals if not found
                    setSearchedToken({
                        name: name,
                        symbol: symbol,
                        img: unknownToken,
                        address: address,
                        decimals: decimals,
                        pumpfun: false,
                        display: true
                    })
                    setTokenSearch(true)
                }
                setSearcheTokenAddress('')
            } else {
                setTokenSearch(false)
            }
        } catch (e) { console.log(e) }

    }

    const changeToken1Amount = async (e) => {
        try {
            console.log('token1amount handle : ', e);
            setToken1Amount(e);

            if (e === "" || Number(e) <= 0) {
                setToken2Amount("0");
                return;
            }

            const calls = [
                {
                    address: factoryAddress, // Replace with your factory address
                    abi: factoryABI,
                    functionName: "getPair",
                    args: [firstToken.address, secondToken.address],
                },
                {
                    address: routerAddress, // Replace with your router address
                    abi: routerABI,
                    functionName: "getAmountsOut",
                    args: [
                        quais.parseUnits(e, firstToken.decimals), // Input amount in the token's decimals
                        [firstToken.address, secondToken.address],
                    ],
                },
            ];

            const results = await multicall(wagmiConfig, { contracts: calls });
            const pairAddress = results[0].status === "success" ? results[0].result : "0x0000000000000000000000000000000000000000";
            let path = [firstToken.address, secondToken.address];

            if (pairAddress === Zero) {
                path = [firstToken.address, WETH, secondToken.address];

                // Update getAmountsOut with intermediary path
                const amountsOutWithIntermediary = await readContract(wagmiConfig, {
                    address: routerAddress,
                    abi: routerABI,
                    functionName: "getAmountsOut",
                    args: [quais.parseUnits(e, firstToken.decimals), path],
                });

                setToken2Amount(quais.formatUnits(amountsOutWithIntermediary[amountsOutWithIntermediary.length - 1], secondToken.decimals));
            } else {
                const amountsOut = results[1].status === "success" ? results[1].result : [0];
                setToken2Amount(quais.formatUnits(amountsOut[amountsOut.length - 1], secondToken.decimals)); // Output amount
            }
        } catch (e) {
            console.log('changeToken1Amount : ', e);
        }
    }

    const changeToken2Amount = async (e) => {
        try {
            console.log('token2amount handle: ', e);
            setToken2Amount(e);

            if (e === "" || Number(e) <= 0) {
                setToken1Amount("0");
                return;
            }

            // Multicall to check for pair existence and get input amounts
            const calls = [
                {
                    address: factoryAddress, // Replace with your factory address
                    abi: factoryABI,
                    functionName: "getPair",
                    args: [firstToken.address, secondToken.address],
                },
                {
                    address: routerAddress, // Replace with your router address
                    abi: routerABI,
                    functionName: "getAmountsIn",
                    args: [
                        quais.parseUnits(e, secondToken.decimals), // Desired output amount in token's decimals
                        [firstToken.address, secondToken.address], // Initial path
                    ],
                },
            ];

            const results = await multicall(wagmiConfig, { contracts: calls });

            // Determine the swap path
            let path = [firstToken.address, secondToken.address];
            const directPair = results[0].status === "success" ? results[0].result : "0x0000000000000000000000000000000000000000";

            if (directPair === Zero) {
                // No direct pair, fallback to WETH as intermediary
                path = [firstToken.address, WETH, secondToken.address];
                // Update getAmountsIn with fallback path
                const amountsInWithIntermediary = await readContract(wagmiConfig, {
                    address: routerAddress,
                    abi: routerABI,
                    functionName: "getAmountsIn",
                    args: [quais.parseUnits(e, secondToken.decimals), path],
                });
                setToken1Amount(quais.formatUnits(amountsInWithIntermediary[0], firstToken.decimals));
            } else {
                const amountsIn = results[1].status === "success" ? results[1].result : [0];
                setToken1Amount(quais.formatUnits(amountsIn[0], firstToken.decimals)); // Input amount
            }
        } catch (error) {
            console.log('changeToken2Amount error: ', error);
        }
    };


    const approve = async () => {
        const signer = await walletProvider.getSigner();
        let tokenContract;
        const routerContract = routerAddress; // Use the router address directly
        const fromTokenAddress = firstToken.address.toLowerCase();

        // Check if fromToken is WETH (or QUAI)
        if (fromTokenAddress === WETH.toLowerCase()) {
            // No approval needed for WQUAI when sending QUAI
            return;
        } else {
            // Approve the token being sent
            tokenContract = new quais.Contract(quais.getAddress(fromTokenAddress), erc20ABI, signer);

            const allowance = await tokenContract.allowance(address, routerAddress);
            if (allowance < quais.parseQuai(token1Amount)) {
                let hide = messageApi.loading("Approving token...", 0); // 0 means the message stays until manually hidden
                try {
                    const tx = await tokenContract.approve(routerContract, quais.MaxUint256);
                    await tx.wait(1);
                    hide(); // Hide the loading message
                    messageApi.success("Token Approved");
                } catch (error) {
                    if (hide) hide(); // Ensure the message is hidden if there was an error
                    messageApi.error("Approval failed");
                    console.error(error);
                }
                await sleep(1000);
            }
        }

    }

    const handleSwap = async () => {
        let hide;
        try {
            const signer = await walletProvider.getSigner();
            const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
            const routerContract = new quais.Contract(
                routerAddress,
                routerABI,
                signer
            );

            if (token1Amount == null || token2Amount == null || token1Amount == "0" || token2Amount == "0") {
                messageApi.error("Invalid amount");
                return;
            }

            if (firstToken.address == secondToken.address) {
                messageApi.error("Cannot swap same token");
                return;
            }
            if (firstToken.address.toLowerCase() === WETH && secondToken.address.toLowerCase() === WETH) {
                messageApi.error('Cannot swap WQUAI for WQUAI.')
                return
            }
            if (token1Amount > Number(balance1)) {
                messageApi.error('Insufficient balance.')
                return
            }

            // Determine the swap path
            let path = [firstToken.address, secondToken.address];
            const directPair = await readContract(wagmiConfig, {
                address: factoryAddress, // Replace with your factory address
                abi: factoryABI,
                functionName: "getPair",
                args: [firstToken.address, secondToken.address],
            })
            if (directPair === "0x0000000000000000000000000000000000000000") {
                // No direct pair, fallback to WETH as intermediary
                path = [firstToken.address, WETH, secondToken.address];
            }

            if (firstToken.address.toLowerCase() != WETH.toLowerCase()) {

            }

            const token1 = quais.parseQuai(token1Amount);
            const token2 = quais.parseQuai(token2Amount);

            let tx;

            // Adjusted Slippage Calculation
            const SLIPPAGE_SCALE = 10000n; // Scale for precision (10000 = 0.01% granularity)
            const slippageBigInt = BigInt(Math.round(slippage * 100)); // Convert slippage to scaled integer (e.g., 1% -> 100)
            const slippageCalc = (BigInt(token2) * (SLIPPAGE_SCALE - slippageBigInt)) / SLIPPAGE_SCALE;
            console.log('slippage', slippageCalc.toString());
            hide = messageApi.loading("Swapping tokens...", 0); // Show persistent loading message

            if (firstToken.address.toLowerCase() === WETH.toLowerCase()) {
                console.log("Swapping WQUAI -> Token...");
                tx = await routerContract.swapExactETHForTokens(
                    slippageCalc.toString(),
                    path,
                    address,
                    deadline,
                    { value: token1 }
                );
            } else if (secondToken.address.toLowerCase() === WETH.toLowerCase()) {
                const { supportsPermit, allowance } = await tokenSupportsPermit(firstToken.address, address);
                if (supportsPermit && !isAllowanceNearInfinite(allowance)) {
                    const { v, r, s } = await signEip2612Permit(firstToken.address, signer, deadline);
                    tx = await routerContract.swapExactTokensForETHWithPermit(
                        token1,
                        slippageCalc.toString(),
                        path,
                        address,
                        deadline,
                        true,
                        v,
                        r,
                        s
                    )
                } else {
                    if (!isAllowanceNearInfinite(allowance)) {
                        await approve();
                    }
                    console.log("Swapping Token -> WQUAI...");
                    tx = await routerContract.swapExactTokensForETH(
                        token1,
                        slippageCalc.toString(),
                        path,
                        address,
                        deadline
                    );
                }
            } else {
                const { supportsPermit, allowance } = await tokenSupportsPermit(firstToken.address, address);
                if (supportsPermit && !isAllowanceNearInfinite(allowance)) {
                    const { v, r, s } = await signEip2612Permit(firstToken.address, signer, deadline);
                    tx = await routerContract.swapExactTokensForTokensWithPermit(
                        token1,
                        slippageCalc.toString(),
                        path,
                        address,
                        deadline,
                        true,
                        v,
                        r,
                        s
                    )
                } else {
                    if (!isAllowanceNearInfinite(allowance)) {
                        await approve();
                    }
                    console.log("Swapping Token -> Token (direct or via WETH)...");
                    tx = await routerContract.swapExactTokensForTokens(
                        token1,
                        slippageCalc.toString(),
                        path,
                        address,
                        deadline
                    );
                }
            }
            if (tx) {
                await tx.wait(1);
                hide(); // Hide the loading message after transaction confirmation
                setToggleFetchBalances(!toggleFetchBalances);
                messageApi.success("Swap Successful");
            }

        } catch (error) {
            if (hide) hide(); // Ensure the loading message is hidden on error
            messageApi.error("Swap failed");
            console.error("Error swap TOKEN:", error);
        }
    }

    async function switchTokens() {

        // const tk = token2Amount;
        setToken1Amount(token2Amount)
        setToken2Amount(token1Amount)
        // await changeToken1Amount(tk);

        const one = firstToken;
        const two = secondToken;
        const isTokenFirst = await getisTokenFirst(pair, one.address);
        console.log('[Night] switchTokens', isTokenFirst)
        setisTokenFirst(isTokenFirst)
        setFirstToken(two);
        setSecondToken(one);
        setSell(!isSell)
    }

    function openModal(asset) {
        setSelectedToken(asset);
        setIsOpenModal(true);
    }

    const modifySearchToken = async (token) => {
        console.log('modifySearchToken')
        if (selectedToken === 1) {
            if (token.address.toLowerCase() === firstToken.address.toLowerCase()) {
                setIsOpenModal(false);
                return;
            }
            if (token.address.toLowerCase() === secondToken.address.toLowerCase()) {
                await switchTokens();
                setIsOpenModal(false);
                return;
            }
            token.address = quais.getAddress(token.address)
            const pair = await getPairAddress(token.address, secondToken.address);
            setPair(pair.toLowerCase())
            const isTokenFirst = await getisTokenFirst(pair, secondToken.address);
            console.log('[Night] firstTOken modified', isTokenFirst)
            setisTokenFirst(isTokenFirst)
            setFirstToken(token);
        }
        else {
            if (token.address.toLowerCase() === secondToken.address.toLowerCase()) {
                setIsOpenModal(false);
                return;
            }
            if (token.address.toLowerCase() === firstToken.address.toLowerCase()) {
                await switchTokens();
                setIsOpenModal(false);
                return;
            }
            token.address = quais.getAddress(token.address)
            const pair = await getPairAddress(firstToken.address, token.address);
            setPair(pair.toLowerCase())
            const isTokenFirst = await getisTokenFirst(pair, token.address);
            console.log('[Night] secondToken modified', isTokenFirst)
            setisTokenFirst(isTokenFirst)
            setSecondToken(token);
        }

        setToken1Amount("0");
        setToken2Amount("0");
        setIsOpenModal(false);
        setTokenSearch(false);
    }
    const HandleModalCancel = () => {
        setSearcheTokenAddress('');
        setTokenSearch(false)
        setIsOpenModal(false);
    }

    const settings = (
        <>
            <div>
                <Radio.Group value={slippage}>
                    <Radio.Button value={0.1} onClick={() => setSlippage(0.1)}>0.1%</Radio.Button>
                    <Radio.Button value={0.2} onClick={() => setSlippage(0.2)}>0.2%</Radio.Button>
                    <Radio.Button value={0.3} onClick={() => setSlippage(0.3)}>0.3%</Radio.Button>
                </Radio.Group>
            </div>
        </>
    );
    return (

        <>
            <Modal open={isOpenModal} footer={null} onCancel={HandleModalCancel} title="Select a Token">
                <div className="searchToken">
                    <Input placeholder="Search token address" value={searchTokenAddress} onChange={(e) => HandleTokenAddress(e.target.value)} />
                </div>
                <div className="modalContent">
                    {
                        !isTokenSearch ? ListToken?.map((item, index) =>
                        (
                            item.display &&
                            <div className="tokenChoice" key={index} onClick={() => modifySearchToken(item)}>
                                <img src={item.img} alt={item.symbol} className="tokenLogo" />
                                <div className="tokenChoiceNames">
                                    <div className="tokenName">{item.name}</div>
                                    <div className="tokensymbol">{item.symbol}</div>
                                </div>
                            </div>
                        )) : (<div className="tokenChoice" onClick={() => modifySearchToken(searchedToken)}>
                            <img src={searchedToken.img} alt={searchedToken.symbol} className="tokenLogo" />
                            <div className="tokenChoiceNames">
                                <div className="tokenName">{searchedToken.name}</div>
                                <div className="tokensymbol">{searchedToken.symbol}</div>
                            </div>
                        </div>)
                    }
                </div>
            </Modal>
            {contextHolder}
            <div className="w-[100%] lg:w-[80%] lg:h-[80vh] justify-center flex flex-col lg:flex-row gap-8 lg:gap-5 px-[15px] md:px-[30px] lg:px-0 pb-8 lg:pb-0">
                {showChart && (
                    <div
                        className="h-[60vh] !border !border-gray-500 rounded-md min-h-[480px]"
                        ref={container}
                        style={{ height: "auto", width: "100%" }}
                    >
                        <Chart
                            stock={"Stock"}
                            interval="1"
                            pair={pair}
                            isTokenFirst={isTokenFirst}
                            symbol={`${token0forPair} / ${token1forPair}`}
                        />
                    </div>
                )}
                {/* </EasingY> */}
                <div className="flex justify-center">
                    <div className="tradeBox">
                        <div className="tradeBoxHeader">
                            <div className="tradeBoxSubHeaderButtonGroup">
                                <Button
                                    className="subHeaderbutton"
                                    style={{ background: "#E22901" }}
                                    onClick={() => setShowChart((prev) => !prev)}
                                >
                                    {`${showChart ? `Hide` : `Show`} Chart`}
                                </Button>
                                <Button
                                    className="subHeaderbutton"
                                    style={{ background: "none" }}
                                    onClick={() => window.open("https://info.quaiswap.io", "_blank")}
                                >
                                    Info
                                </Button>
                                <Button className="subHeaderbutton" style={{ background: "none" }}>
                                    Limit (Coming Soon)
                                </Button>
                            </div>

                            <Popover
                                content={settings}
                                title="Slippage Settings"
                                trigger="click"
                                placement="bottomRight">
                                <SettingOutlined className="corg" />
                            </Popover>
                        </div>

                        <div className="inputs">
                            <div className="normal-Input-Div">
                                <div className="input-component" style={{ marginTop: '10px' }}>
                                    <input placeholder="0" value={token1Amount} onChange={(e) => changeToken1Amount(e.target.value)} className="input-custom"></input>
                                    <div className="asset" onClick={() => openModal(1)}>
                                        <img src={firstToken.img} alt="assetLogo" className="assetLogo" />
                                        {firstToken.symbol}
                                        <DownOutlined />
                                    </div>
                                </div>
                                <div className="tokenBalance" onClick={() => handleTokenBalanceClick(1)}>
                                    Balance: {balance1 || '...'}
                                </div>

                                <div className="buysellTitle">Sell</div>
                            </div>
                            <div className="normal-Input-Div">
                                <div className="input-component" style={{ marginTop: '15px' }}>
                                    <input placeholder="0" value={token2Amount} onChange={(e) => changeToken2Amount(e.target.value)} className="input-custom"></input>
                                    <div className="asset" onClick={() => openModal(2)}>
                                        <img src={secondToken.img} alt="assetLogo" className="assetLogo" />
                                        {secondToken.symbol}
                                        <DownOutlined />
                                    </div>
                                </div>
                                <div className="tokenBalance" onClick={() => handleTokenBalanceClick(2)}>
                                    Balance: {balance2 || '...'}
                                </div>
                                <div className="buysellTitle">Buy</div>
                            </div>

                            <div className="switchButton" onClick={() => switchTokens()}>
                                <ArrowDownOutlined className="switchArrow" />
                            </div>

                        </div>

                        <Button className="bigButton" disabled={!isConnected} onClick={() => handleSwap()}>
                            Swap
                        </Button>
                    </div>
                </div >
            </div >
        </>
    );
}

export default memo(Swap);

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function truncateDecimals(value, decimals) {
    const decimalIndex = value.indexOf('.');
    if (decimalIndex === -1) {
        // No decimal point, return as is
        return value;
    }
    return value.substring(0, decimalIndex + decimals + 1);
}
