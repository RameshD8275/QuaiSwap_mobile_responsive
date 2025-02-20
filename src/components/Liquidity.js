import { useEffect, useState } from "react";
import { Modal, Button, Input, message, Slider } from "antd";
import {
    PlusOutlined,
    DownOutlined,
} from "@ant-design/icons";
import { useQuaisProvider } from "../util/provider";
import { useAccount, useChainId, useReadContracts, useBalance, useReadContract } from "wagmi";
import { readContract, multicall, getBalance } from "@wagmi/core";
import routerABI from "../assets/abi/IUniSwapV2Router02.json";
import pairABI from "../assets/abi/ILiquidity.json";
import wethABI from "../assets/abi/IETH.json";
import erc20ABI from "../assets/abi/IERC20.json";
import factoryABI from "../assets/abi/IUniswapV2Factory.json";
import { FetchTokenList } from "../assets/FetchtokenList.js";
import unknownToken from "../assets/img/tokenquestion.png";
import { quais } from 'quais'
import { BrowserProvider } from "quais";
import ReactSlider from "react-slider";
import BigNumber from "bignumber.js";
import Paragraph from "antd/es/skeleton/Paragraph";
import { FetchUserLiquidity } from "./FetchLiquidity.ts";
import wagmiConfig from "../util/wagmiconfig.js";
import { quai } from "../util/quaiChain.js";
import { tokenSupportsPermit, signEip2612Permit, isAllowanceNearInfinite } from "./Helpers.js";
import { tokenList, tokenTemp, LpTemp, routerAddress, factoryAddress, WETH, Zero } from "../constant/constant.js";


function Liquidity() {
    const chainId = useChainId();
    const { walletProvider, error } = useQuaisProvider(chainId);
    const { address, isConnected } = useAccount();
    if (error != null) {
        console.log('error', error)
    }

    //swap, addliquidity page params
    const [mode, setMode] = useState(1);
    const [token1Amount, setToken1Amount] = useState(null);
    const [token2Amount, setToken2Amount] = useState(null);
    const [firstToken, setFirstToken] = useState(tokenList.QUAI);
    const [searchedToken, setSearchedToken] = useState(tokenTemp);
    const [secondToken, setSecondToken] = useState(tokenList.QSWAP);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isOpenLpModal, setIsOpenLpModal] = useState(false);
    const [selectedToken, setSelectedToken] = useState(1);
    const [liquidityRate, setLiquidityRate] = useState(0);
    const [liquidityPercentage, setLiquidityPercentage] = useState(0);
    const [balance1, setBalance1] = useState(null); // Token 1 balance
    const [balance2, setBalance2] = useState(null); // Token 2 balance

    //messageAPI
    const [messageApi, contextHolder] = message.useMessage();

    //Modal Search content
    const [isTokenSearch, setTokenSearch] = useState(false)

    const [searchTokenAddress, setSearcheTokenAddress] = useState('')
    const [pairToken1Address, setPairToken1Address] = useState('')

    //LP list loading flag
    const [LpList, setLpList] = useState([LpTemp]);
    const [isLPloading, setLPLoading] = useState(false)

    //LP list item params
    const [lpAmount, setLpAmount] = useState('0')
    const [lpBalance, setLpBalance] = useState('0');
    const [lpToken0, setLpToken0] = useState(tokenList.QSWAP)
    const [lpToken1, setLpToken1] = useState(tokenList.QUAI)
    const [lpAddress, setLpAddress] = useState('')
    const [isLPTokenSearch, setLPTokenSearch] = useState(false)
    const [searchLpTokenAddress, setSearchLpTokenAddress] = useState('')
    const [searchedLP, setSearchedLP] = useState(tokenList.QUAI)
    const [ListToken, setTokenList] = useState([tokenTemp])
    // Contract Addresses
    

    useEffect(() => {
        handleTokenList();
    }, [])

    const handleTokenList = async () => {
        let tokens = await FetchTokenList()
        setTokenList(tokens)
    }

    useEffect(() => {
        const fetchLiquidity = async () => {
        await TokenRateCalcOnLiquidity();
        await LPShareCalc();
        await fetchBalances();
        }
        fetchLiquidity();
    }, [firstToken.address, secondToken.address])

    useEffect(() => {
        if (!address) return;
        GetAllPairs();
    }, [address])

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

    const toExponentialFormat = (number) => {
        const bigNum = new BigNumber(number)
        return bigNum.toExponential(2)
    }

    const GetAllPairs = async () => {
        console.log('GetAllPairs')
        const pairLength = await readContract(wagmiConfig,{
            address: factoryAddress, // Replace with your factory address
            abi: factoryABI,
            functionName: "allPairsLength",
          });
        console.log('pairlength', pairLength)
        let lpListTemp = [];


        setLPLoading(true)
        let pairs = await FetchUserLiquidity(address)
        /*for (let i = 0; i < Pairlength; i++) {
            console.log('pairIndex', i)
            const pairAddress = await factoryContract.allPairs(i)
            const LpContract = new quais.Contract(pairAddress, pairABI, RPCProvider)
            let balance = await LpContract.balanceOf(address)
            console.log('LpBalance', balance)
            if (balance === 0) continue;
            if (balance > 0) {
                console.log('LpAddress : ', pairAddress)
                const token0 = await LpContract.token0()
                const token1 = await LpContract.token1()

                const token1Contract = new quais.Contract(token0, erc20ABI, RPCProvider)
                const token2Contract = new quais.Contract(token1, erc20ABI, RPCProvider)
                const symbol1 = await token1Contract.symbol()
                const symbol2 = await token2Contract.symbol()
                const name1 = await token1Contract.name()
                const name2 = await token2Contract.name()
                const decimal1 = await token1Contract.decimals()
                const decimal2 = await token2Contract.decimals()
                const balance = await LpContract.balanceOf(address)
                const img1 = token0 === WETH ? tokenList[0].img : tokenList[1].img
                const img2 = token1 === WETH ? tokenList[0].img : tokenList[1].img
                const lpTemp = {
                    token0: {
                        symbol: symbol1,
                        img: img1,
                        name: name1,
                        decimals: decimal1,
                        address: token0
                    },
                    token1: {
                        symbol: symbol2,
                        img: img2,
                        name: name2,
                        decimals: decimal2,
                        address: token1
                    },
                    address: pairAddress,
                    balance: quais.formatQuai(balance)
                };
                lpListTemp.push(lpTemp)
            }
        }
        console.log("LpList : ", lpListTemp)
        setLpList(lpListTemp)*/
        setLpList(pairs)
        setLPLoading(false)
        pairs.map((item, index) => {
            if (item.address.toLowerCase() == "0x007c154ca5933c73cb1bd985ab81bcda5df36dd0") {
                modifyLPToken(item)
            }
            console.log('LpList ', index, 'item : ', item)
        })

    }

    const LPShareCalc = async () => {
        try {
            const pairAddress = await readContract(wagmiConfig,{
                address: factoryAddress, // Replace with your factory address
                abi: factoryABI,
                functionName: "getPair",
                args: [firstToken.address, secondToken.address]
              });
            if (pairAddress !== Zero) {
                const inputLpAmount = Number(Math.sqrt(Number(quais.parseQuai(String(Number(token1Amount).toFixed(10)))) * Number(quais.parseQuai(String(Number(token2Amount).toFixed(10))))))
                console.log('token1', token1Amount, 'token2', token2Amount, 'inputLpAmount', inputLpAmount)
                let contracts = []

                const calls = [
                    {
                      address: firstToken.address,
                      abi: firstToken.address === WETH ? wethABI : erc20ABI,
                      functionName: "balanceOf",
                      args: [pairAddress],
                    },
                    {
                      address: secondToken.address,
                      abi: secondToken.address === WETH ? wethABI : erc20ABI,
                      functionName: "balanceOf",
                      args: [pairAddress],
                    },
                  ];
                const results = await multicall(wagmiConfig, { contracts: calls });
                const token1Balance = results[0].status === "success" ? results[0].result : "0";
                const token2Balance = results[1].status === "success" ? results[1].result : "0";

                console.log('token1Balance', token1Balance)
                console.log('token2Balance', token2Balance)

                const LpTotalAmount = Math.sqrt(Number(token1Balance) * Number(token2Balance))

                console.log('LpTotalAmount', LpTotalAmount)

                const percentage = inputLpAmount / LpTotalAmount;
                console.log('percentage', percentage)
                setLiquidityPercentage(String(Number(percentage).toFixed(3)))
            }
            else
                setLiquidityPercentage('0')
        } catch (e) { console.log(e) }
    }

    const openModal = (asset) => {
        if (asset === 3) {
            setIsOpenLpModal(true);
            return
        }
        else {
            setSelectedToken(asset);
            setIsOpenModal(true);
        }
    };

    const switchTokens = async () => {
        setToken1Amount(token2Amount);
        setToken2Amount(token1Amount);
        const one = firstToken;
        const two = secondToken;
        setFirstToken(two);
        setSecondToken(one);
    }

    const TokenRateCalcOnLiquidity = async () => {
        console.log('TokenRateCalcOnLiquidity...');
        if (await CreatedPairAddress() === Zero) {
            console.log('TokenRateCalcOnLiquidity...   No Pair');
            setLiquidityRate(0);
            console.log('Pair is not existed')
        }
        else {
            console.log('TokenRateCalcOnLiquidity...   CalcReserve');
            await calcReserve();
        }
    }
    const modifyLPToken = (lpItem) => {
        console.log('modifyLPToken---------token0 : ', lpItem.token0.address, 'token1 :', lpItem.token1.address, "LpAddress : ", lpItem.address)
        setLpBalance(quais.formatQuai(lpItem.balance))
        setLpToken0(lpItem.token0)
        setLpToken1(lpItem.token1)
        setLpAddress(lpItem.address)
        setIsOpenLpModal(false);
    }
    const modifySearchToken = async (token) => {
        console.log('modifySearchToken FirstToken', token.address, firstToken.address)
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
            setSecondToken(token);
        }
        // await TokenRateCalcOnLiquidity();

        setToken1Amount(null);
        setToken2Amount(null);
        setIsOpenModal(false);
    }
    const handleTokenBalanceClick = (balance) => {
        handleLpAmount(balance)
    }
    const handleLpAmount = async (e) => {
        try {
            setLpAmount(e)
            if (Number(e) < 0) { setLpAmount(''); return; }
            if (quais.parseQuai(e) > quais.parseQuai(lpBalance)) {
                messageApi.error("Insufficiant Balance!");
                return;
            }
        } catch (e) {
            console.log('HandleLpAmount,', e)
        }
    }
    const handleToken1Amount = async (e) => {
        try {
            setToken1Amount(e);
            if (Number(e) <= 0) { 
                setLiquidityPercentage(0)
                setToken2Amount(0); 
                return; 
            }
            const pairAddress = await readContract(wagmiConfig, {
                address: factoryAddress,
                abi: factoryABI,
                functionName: "getPair",
                args: [firstToken.address, secondToken.address],
              });
            if (pairAddress === Zero) {
                setLiquidityRate(0)
                return;
            }

                // Multicall to get token0 and balances
            const calls = [
                {
                address: pairAddress,
                abi: pairABI,
                functionName: "token0",
                },
                {
                address: firstToken.address,
                abi: firstToken.address.toLowerCase() === WETH.toLowerCase() ? wethABI : erc20ABI,
                functionName: "balanceOf",
                args: [pairAddress],
                },
                {
                address: secondToken.address,
                abi: secondToken.address.toLowerCase() === WETH.toLowerCase() ? wethABI : erc20ABI,
                functionName: "balanceOf",
                args: [pairAddress],
                },
            ];
            const results = await multicall(wagmiConfig, { contracts: calls });
            const token0 = results[0].status === "success" ? results[0].result : null;
            const token1Balance = results[1].status === "success" ? results[1].result : "0";
            const token2Balance = results[2].status === "success" ? results[2].result : "0";
            let rate;
            if (token0 && token0.toLowerCase() === firstToken.address.toLowerCase())
                rate = liquidityRate
            else
                rate = liquidityRate === 0 ? 0 : (1 / liquidityRate)
            const token2Amount = Number(e) * rate
            setToken2Amount(String(token2Amount.toFixed(10)))

            //await LPShareCalc()  // state variable doesn't response directly and return previous value. so moved function's body

            const firstInputAmount = quais.parseQuai(Number(e).toFixed(10))
            const secondInputAmount = quais.parseQuai(Number(token2Amount).toFixed(10))
            const sqrtLp = Math.sqrt(Number(firstInputAmount) * Number(secondInputAmount))
            console.log('first : ', firstInputAmount, 'second :', secondInputAmount, ' sqrtLp : ', sqrtLp)

            console.log('token1Balance', token1Balance)
            console.log('token2Balance', token2Balance)

            const lpTotalAmount = Math.sqrt(Number(token1Balance) * Number(token2Balance))

            console.log('LpTotalAmount', lpTotalAmount)

            const percentage = lpTotalAmount > 0 ? sqrtLp / lpTotalAmount : 0;
            console.log('percentage', percentage)
            setLiquidityPercentage(String(Number(percentage).toFixed(3)))
        }
        catch (error) {
            console.log('handleToken1Amount', error)
        }
    }
    const calcReserve = async () => {
        console.log('Reserve is Calculating....');
        const pairAddress = await readContract(wagmiConfig, {
            address: factoryAddress, // Replace with your factory contract address
            abi: factoryABI,
            functionName: "getPair",
            args: [firstToken.address, secondToken.address],
          });
        if (pairAddress === Zero) {
            setLiquidityRate(0)
            return;
        }
        const [reserveIn, reserveOut] = await readContract(wagmiConfig, {
            address: pairAddress,
            abi: pairABI,
            functionName: "getReserves",
          });
        const rate = Number(reserveOut) / Number(reserveIn);
        console.log('rate : ', rate);
        setLiquidityRate(rate)
    }

    const handleToken2Amount = async (e) => {
        try {
            setToken2Amount(e);
            if (Number(e) <= 0) {
                setLiquidityPercentage("0");
                setToken1Amount(0);
                return;
              }
            const pairAddress = await readContract(wagmiConfig, {
                address: factoryAddress,
                abi: factoryABI,
                functionName: "getPair",
                args: [firstToken.address, secondToken.address],
              });
            if (pairAddress === Zero) {
                setLiquidityPercentage("0");
                return;
            }
            const calls = [
                {
                  address: pairAddress,
                  abi: pairABI,
                  functionName: "token0",
                },
                {
                  address: firstToken.address,
                  abi: firstToken.address.toLowerCase() === WETH.toLowerCase() ? wethABI : erc20ABI,
                  functionName: "balanceOf",
                  args: [pairAddress],
                },
                {
                  address: secondToken.address,
                  abi: secondToken.address.toLowerCase() === WETH.toLowerCase() ? wethABI : erc20ABI,
                  functionName: "balanceOf",
                  args: [pairAddress],
                },
              ];
              const results = await multicall(wagmiConfig, { contracts: calls });

            const token0 = results[0].status === "success" ? results[0].result : null;
            const token1Balance = results[1].status === "success" ? results[1].result : "0";
            const token2Balance = results[2].status === "success" ? results[2].result : "0";
            let rate;
            if (token0 && token0.toLowerCase() === firstToken.address.toLowerCase())
                rate = liquidityRate === 0 ? 0 : (1 / liquidityRate)
            else
                rate = liquidityRate
            const token1Amount = Number(e) * rate
            setToken1Amount(String(token1Amount.toFixed(10)))

                //await LPShareCalc()  // state variable doesn't response directly and return previous value. so moved function's body

            const secondInputAmount = quais.parseQuai(Number(e).toFixed(10))
            const firstInputAmount = quais.parseQuai(Number(token1Amount).toFixed(10))
            const sqrtLp = Math.sqrt(Number(firstInputAmount) * Number(secondInputAmount))
            console.log('HandleToken2Amount----- first : ', firstInputAmount, 'second :', secondInputAmount, ' sqrtLp : ', sqrtLp)

            console.log('token1Balance', token1Balance)
            console.log('token2Balance', token2Balance)

            const lpTotalAmount = Math.sqrt(Number(token1Balance) * Number(token2Balance))

            console.log('LpTotalAmount', lpTotalAmount)

            const percentage = lpTotalAmount > 0 ? sqrtLp / lpTotalAmount : 0;
            console.log('percentage', percentage)
            setLiquidityPercentage(String(Number(percentage).toFixed(3)))

        }
        catch (error) {
            console.log('handleToken1Amount', error)
        }
    }

    const CreatedPairAddress = async () => {
        if (!isConnected) return;

        const hasPair = await readContract(wagmiConfig, {
            address: factoryAddress, // Replace with your factory contract address
            abi: factoryABI,
            functionName: "getPair",
            args: [firstToken.address, secondToken.address],
          });
        
        if (hasPair === Zero) {
            console.log('CreatedPairAddress PairAddress :', hasPair);
            return hasPair;
        }
        const token1 = await readContract(wagmiConfig, {
            address: hasPair,
            abi: pairABI,
            functionName: "token0",
        });
        setPairToken1Address(token1);
        return hasPair;
    }

    const approve = async () => {
        const hide = messageApi.loading("Approving tokens...", 0);
        try {
            const signer = await walletProvider.getSigner();
            let token2Contract, token1Contract;
            const routerContract = new quais.Contract(
                routerAddress,
                routerABI,
                signer
            );
    
            // Check and approve for the second token
            if (secondToken.address !== WETH) {
                try {
                    token2Contract = new quais.Contract(secondToken.address, erc20ABI, signer);
                    const allowance2 = await token2Contract.allowance(address, routerAddress);
                    if (!isAllowanceNearInfinite(allowance2)) {
                        const tx1 = await token2Contract.approve(routerContract, quais.MaxUint256);
                        if (tx1) await tx1.wait();
                    }
                } catch (error) {
                    console.error("Error approving second token:", error);
                    messageApi.error("Failed to approve second token.");
                    throw error; // Re-throw to ensure `finally` runs after logging
                }
            }
    
            // Check and approve for the first token
            if (firstToken.address !== WETH) {
                try {
                    token1Contract = new quais.Contract(firstToken.address, erc20ABI, signer);
                    const allowance1 = await token1Contract.allowance(address, routerAddress);
                    if (!isAllowanceNearInfinite(allowance1)) {
                        const tx = await token1Contract.approve(routerContract, quais.MaxUint256);
                        if (tx) await tx.wait();
                    }
                } catch (error) {
                    console.error("Error approving first token:", error);
                    messageApi.error("Failed to approve first token.");
                    throw error; // Re-throw to ensure `finally` runs after logging
                }
            }
    
            messageApi.success("Tokens successfully approved!");
        } catch (error) {
            console.error("General error in approval process:", error);
            messageApi.error("Approval process failed.");
            // Optionally propagate the error to inform the caller
            throw error;
        } finally {
            hide(); // Ensure loading indicator is removed
            console.log("Approval process finished.");
        }
    };

    const handleRemoveLiquidity = async () => {
        try {
            if (Number(lpAmount) <= 0) {
                messageApi.error("Invalid amount");
                return;
            }
            if (Number(lpAmount) > Number(lpBalance)) {
                messageApi.error("Insufficiant LP token");
                return;
            }
            if (isLPloading) {
                messageApi.error("LpList is not loaded.");
                return;
            }
            const signer = await walletProvider.getSigner();
            const contractLiquidity = new quais.Contract(
                quais.getAddress(lpAddress),
                pairABI,
                signer
            );
            //approve LP transfer from Pair contract(LP) to Routercontract
            const allowance = await contractLiquidity.allowance(address, routerAddress);
            if (!isAllowanceNearInfinite(allowance)) {
                const approve = await contractLiquidity.approve(
                    routerAddress,
                    quais.MaxUint256
                );
                if (approve) await approve.wait();
            }
            const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

            const routerContract = new quais.Contract(
                routerAddress,
                routerABI,
                signer
            );

            const token1Address = quais.getAddress(lpToken0.address);
            const token2Address = quais.getAddress(lpToken1.address);

            if (token1Address === WETH || token2Address == WETH) {
                console.log("removeLiquidityETH...");
                const tx_removeLP = await routerContract.removeLiquidityETH(
                    token1Address === WETH ? token2Address : token1Address,
                    quais.parseQuai(lpAmount),
                    0,
                    0,
                    address,
                    deadline
                );
                if (tx_removeLP) {
                    await tx_removeLP.wait(1);
                    messageApi.success("Liquidity removed successfully");
                }
            } // remove percentage TotalLiquidity
            else {
                console.log("removeLiquidity...");
                const tx_removeLP = await routerContract.removeLiquidity(
                    token1Address,
                    token2Address,
                    quais.parseQuai(lpAmount),
                    0,
                    0,
                    address,
                    deadline
                );
                if (tx_removeLP) {
                    await tx_removeLP.wait(1);
                    messageApi.success("Liquidity removed successfully");
                }
            }


        } catch (e) {
            console.log('removeLiquidity...', e)
        }
    }
    const handleAddLiquidity = async () => {
        try {
            if (Number(token1Amount) <= 0 || Number(token2Amount) <= 0) {
                messageApi.error("Invalid amount");
                return;
            }

            const signer = await walletProvider.getSigner();
            const routerContract = new quais.Contract(routerAddress, routerABI, signer);
            const factoryContract = new quais.Contract(
                factoryAddress,
                factoryABI,
                signer
            );

            const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now
            if (Number(token1Amount) > Number(balance1) || Number(token2Amount) > Number(balance2)) {
                messageApi.error("Insufficient balance");
                return;
            }
            
            if (secondToken.address === WETH || firstToken.address === WETH) {
                let value, amountToken1, tokenAddress;
                console.log("adding liquidityETH1 :", token2Amount);
                if (secondToken.address === WETH || !secondToken.address) {
                    value = quais.parseUnits(token2Amount);
                    tokenAddress = firstToken.address;
                }
                else {
                    value = quais.parseUnits(token1Amount);
                    tokenAddress = secondToken.address;

                }
                console.log("adding liquidityETH2 :", Number(secondToken.decimals));
                if (secondToken.address === WETH || !secondToken.address) {
                    amountToken1 = quais.parseUnits(token1Amount, Number(secondToken.decimals));
                }
                else {
                    amountToken1 = quais.parseUnits(token2Amount, Number(firstToken.decimals));
                }
                console.log("adding liquidityETH :", value);
                console.log('amountToken1', amountToken1);
                const { supportsPermit, allowance } = await tokenSupportsPermit(tokenAddress, address);
                let tx_addLiquidity;
                if(supportsPermit && !isAllowanceNearInfinite(allowance)) {
                    const { v, r, s } = await signEip2612Permit(tokenAddress, signer, deadline)
                    tx_addLiquidity = await routerContract.addLiquidityETHWithPermit(
                        tokenAddress,
                        amountToken1,
                        0,
                        0,
                        address,
                        deadline,
                        {
                            v: v,
                            r: r,
                            s: s,
                            approveMax: true
                        },
                        { value: value }
                    );
                } else {
                    if (!isAllowanceNearInfinite(allowance)) {
                        await approve();
                    }
                    tx_addLiquidity = await routerContract.addLiquidityETH(
                        tokenAddress,
                        amountToken1,
                        0,
                        0,
                        address,
                        deadline,
                        { value: value }
                    );
                }
                let hide = messageApi.loading("Adding liquidity...", 0);
                if (tx_addLiquidity) await tx_addLiquidity.wait(1);
                hide();
                messageApi.success("Liquidity added successfully");
                console.log("added liquidityETH :", tx_addLiquidity);
            }
            else {
                console.log("adding liquidity");
                const amount1 = quais.parseUnits(token1Amount, Number(secondToken.decimals));
                const amount2 = quais.parseUnits(token2Amount, Number(firstToken.decimals));

                console.log('amountToken1 : ', amount1, 'amountToken2 : ', amount2);
                const { supportsPermit: supportsPermit1, allowance: allowance1 } = await tokenSupportsPermit(firstToken.address, address);
                const { supportsPermit: supportsPermit2, allowance: allowance2 } = await tokenSupportsPermit(secondToken.address, address);
                let tx_addLiquidity;
                if(supportsPermit1 && supportsPermit2 && (!isAllowanceNearInfinite(allowance1) || !isAllowanceNearInfinite(allowance2))) {
                    const { v: v1, r: r1, s: s1 } = await signEip2612Permit(firstToken.address, signer, deadline)
                    const { v: v2, r: r2, s: s2 } = await signEip2612Permit(secondToken.address, signer, deadline)
                    tx_addLiquidity = await routerContract.addLiquidityWithPermit(
                        quais.getAddress(firstToken.address),
                        quais.getAddress(secondToken.address),
                        amount1,
                        amount2,
                        0,
                        0,
                        address,
                        deadline,
                        {
                            v: v1,
                            r: r1,
                            s: s1,
                            approveMax: true,
                        },
                        {
                            v: v2,
                            r: r2,
                            s: s2,
                            approveMax: true,
                        }
                    );
                } else {
                    if(!isAllowanceNearInfinite(allowance1) || !isAllowanceNearInfinite(allowance2)) {
                        await approve();
                    }
                    tx_addLiquidity = await routerContract.addLiquidity(
                        quais.getAddress(firstToken.address),
                        quais.getAddress(secondToken.address),
                        amount1,
                        amount2,
                        0,
                        0,
                        address,
                        deadline
                    );
                }
                let hide = messageApi.loading("Adding liquidity...", 0);
                if (tx_addLiquidity) await tx_addLiquidity.wait(1);
                hide();
                messageApi.success("Liquidity added successfully");
                console.log("added liquidity :", tx_addLiquidity);
            }
            await calcReserve();
            await LPShareCalc();
        }
        catch (e) { console.log(e) }

    };

    const HandleModalCancel = () => {
        setSearcheTokenAddress('');
        setTokenSearch(false)
        setIsOpenModal(false);
        setIsOpenLpModal(false)
    }
    const handleLPTokenSearch = async (e) => {
        try {
            setSearchLpTokenAddress(e)
            if (!isConnected) return;
            if (await quais.isAddress(e)) {

            }
        }
        catch (e) { console.log() }
    }
    const handleTokenSearch = async (e) => {
        try {
            const address = quais.getAddress(e)
            setSearcheTokenAddress(address)
            console.log('handleTokenSearch', address);
            if (!isConnected) return;
            if (quais.isAddress(address)) {
                if (WETH === address)
                    setSearchedToken(tokenList.QUAI)
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
                        name,
                        symbol,
                        img: unknownToken,
                        address: address,
                        decimals,
                      });
                    setTokenSearch(true)
                }
            } else {
                setTokenSearch(false)
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    return (
        <>
            {contextHolder}
            {mode === 1 ? <Modal open={isOpenModal} footer={null} onCancel={HandleModalCancel} title="Select a Token">
                <div className="searchToken">
                    <Input placeholder="Search token address" value={searchTokenAddress} onChange={(e) => handleTokenSearch(e.target.value)} />
                </div>
                <div className="modalContent">

                    {!isTokenSearch ? ListToken?.map((item, index) => (

                        <div className="tokenChoice" key={index} onClick={() => modifySearchToken(item)}>
                            <img src={item.img} alt={item.symbol} className="tokenLogo" />
                            <div className="tokenChoiceNames">
                                <div className="tokenName">{item.name}</div>
                                <div className="tokensymbol">{item.symbol}</div>
                            </div>
                        </div>
                    ))
                        :
                        <div className="tokenChoice" onClick={() => modifySearchToken(searchedToken)}>
                            <img src={searchedToken.img} alt={searchedToken.symbol} className="tokenLogo" />
                            <div className="tokenChoiceNames">
                                <div className="tokenName">{searchedToken.name}</div>
                                <div className="tokensymbol">{searchedToken.symbol}</div>
                            </div>
                        </div>
                    }

                </div>
            </Modal> :
                <Modal open={isOpenLpModal} footer={null} onCancel={HandleModalCancel} title="Select a Liquidity Pool">
                    <div className="searchToken">
                        <Input placeholder="Search LP token address" value={searchLpTokenAddress} onChange={(e) => handleLPTokenSearch(e.target.value)} />
                    </div>
                    <div className="modalContent">
                        {!isLPloading ? (!isLPTokenSearch ? LpList?.map((item, index) => (
                            <div className="tokenChoice" key={index} onClick={() => { modifyLPToken(item) }}>
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
                        ))
                            :
                            (!isLPloading) &&
                            <div className="tokenChoice" onClick={() => modifyLPToken(searchedLP)}>
                                <img src={searchedLP.img} alt={searchedLP.token0.symbol} className="tokenLogo" />
                                <div className="tokenChoiceNames">
                                    <div className="tokenName">{searchedLP.token0.name}</div>
                                    <div className="tokensymbol">{searchedLP.token0.symbol}</div>
                                </div>
                                <img src={searchedLP.img} alt={searchedLP.token1.symbol} className="tokenLogo" />
                                <div className="tokenChoiceNames">
                                    <div className="tokenName">{searchedLP.token1.name}</div>
                                    <div className="tokensymbol">{searchedLP.token1.symbol}</div>
                                </div>
                            </div>) : <div className="LpLoadingTitle"><p>Loading...</p></div>
                        }

                    </div>
                </Modal>}
            <div className="tradeBox">
                {
                    mode === 0 ?
                        (
                            <div className="tradeBoxHeader">
                                <h4>Your Liquidity</h4>
                                <Button className="smallButton" onClick={() => setMode(1)}>
                                    Back
                                </Button>
                            </div>
                        ) :
                        (
                            <div className="tradeBoxHeader">
                                <h4>Add Liquidity</h4>
                                <Button className="smallButton" onClick={() => 
                                isConnected ? ( setMode(0), setIsOpenLpModal(true) ) : messageApi.error("Please connect your wallet first")}>
                                    Remove Liquidity
                                </Button>
                            </div>
                        )
                }

                {
                    mode === 0 ?
                        (
                            <>
                                <div className="inputs">
                                    <div className="normal-Input-Div">
                                        <div className="input-component">
                                            <input
                                                placeholder="0"
                                                className="input-custom"
                                                style={{ marginLeft: '20px' }}
                                                value={lpAmount}
                                                onChange={(e) => handleLpAmount(e.target.value)}
                                            />
                                            <div className="asset-remove" onClick={() => openModal(3)}>
                                                <img src={lpToken0.img} alt="assetLogo" className="assetLogo" />
                                                <img src={lpToken1.img} alt="assetLogo-overwrite" className="assetLogo-overwrite" />
                                            </div>
                                        </div>

                                        <div className="balance-container">
                                            <div className="balance-remove" onClick={() => handleTokenBalanceClick(lpBalance)}>
                                                LP Token Balance: {Number(lpBalance).toFixed(8)}
                                            </div>
                                            <div className="balance-remove" onClick={() => handleTokenBalanceClick(lpBalance)}>
                                                {lpToken0.name}: {Number(lpToken0.amount).toFixed(4)}
                                            </div>
                                            <div className="balance-remove" onClick={() => handleTokenBalanceClick(lpBalance)}>
                                                {lpToken1.name}: {Number(lpToken1.amount).toFixed(4)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button className="bigButton" onClick={handleRemoveLiquidity} disabled={!isConnected || isLPloading}>
                                    Remove
                                </Button>
                            </>
                        ) :
                        (
                            <>
                                <div className="inputs">
                                    <div className="poolAttention">
                                        <div ></div>
                                        <p className="poolTip"><span style={{ fontWeight: "bold" }}>Tip: </span>When you add liquidity, you will receive pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool and can be redeemed at any time.</p>
                                    </div>
                                    <div className="inputs">
                                        <div className="normal-Input-Div">
                                            <div className="input-component">
                                                <input placeholder="0" className="input-custom" value={token1Amount} onChange={(e) => handleToken1Amount(e.target.value)}></input>
                                                <div className="asset" onClick={() => openModal(1)}>
                                                    <img src={firstToken.img} alt="assetLogo" className="assetLogo" />
                                                    {firstToken.symbol}
                                                    <DownOutlined />
                                                </div></div>
                                        </div>
                                        <div className="normal-Input-Div">
                                            <div className="input-component">
                                                <input placeholder="0" className="input-custom" value={token2Amount} onChange={(e) => handleToken2Amount(e.target.value)}></input>
                                                <div className="asset" onClick={() => openModal(2)}>
                                                    <img src={secondToken.img} alt="assetLogo" className="assetLogo" />
                                                    {secondToken.symbol}
                                                    <DownOutlined />
                                                </div></div></div>
                                        <div className="plusButton">
                                            <PlusOutlined />
                                        </div>

                                    </div>
                                    <div className="poolInfo">
                                        <p style={{ alignSelf: 'start', marginLeft: '20px' }}>Prices & Pool Share</p>
                                        <div className="priceInfo">
                                            <div className="perPrice">
                                                <p style={{ fontWeight: 'bold', margin: '0px' }}>{pairToken1Address === firstToken.address ? Number(liquidityRate).toFixed(7) : (
                                                    liquidityRate === 0 ? 0 : (Number(1 / liquidityRate).toFixed(7)))}</p>
                                                <p style={{ paddingLeft: '5px', paddingRight: '5px', fontSize: '13px' }}>{secondToken.symbol} per {firstToken.symbol}</p>
                                            </div>

                                            <div className="splittPrice"></div>
                                            <div className="perPrice">
                                                <p style={{ fontWeight: 'bold', margin: '0px' }}>{pairToken1Address === firstToken.address ? (
                                                    liquidityRate === 0 ? 0 : (Number(1 / liquidityRate).toFixed(7))) : Number(liquidityRate).toFixed(7)}</p>
                                                <p style={{ fontSize: '13px' }}>{firstToken.symbol} per {secondToken.symbol}</p>
                                            </div>
                                            <div className="splittPrice"></div>
                                            <div className="perPrice">
                                                <p style={{ fontWeight: 'bold', margin: '0px' }}>{liquidityPercentage}%</p>
                                                <p style={{ fontSize: '13px', paddingLeft: '5px', paddingRight: '5px' }}>Share of Pool</p>
                                            </div>

                                        </div>


                                    </div>
                                </div>
                                <Button className="bigButton" onClick={handleAddLiquidity} disabled={!isConnected}>
                                    Supply
                                </Button>
                            </>
                        )
                }
            </div >
        </>
    );
}

function truncateDecimals(value, decimals) {
    const decimalIndex = value.indexOf('.');
    if (decimalIndex === -1) {
      // No decimal point, return as is
      return value;
    }
    return value.substring(0, decimalIndex + decimals + 1);
  }

export default Liquidity;
