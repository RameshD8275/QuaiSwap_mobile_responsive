import { JsonRpcProvider, Contract, quais } from "quais";
import {readContract } from "@wagmi/core";
import {FetchTokenList} from "../assets/FetchtokenList.js";
import unknownToken from "../assets/img/tokenquestion.png";
import pairABI from "../assets/abi/ILiquidity.json";
import { tokenList } from "../constant/constant.js";
import wagmiConfig from "../util/wagmiconfig.js";
import Config from "../util/config.js";
type Token = {
    id: string;
    symbol: string;
    decimals: string,
    name: string;
  };

  type TokenWithAmount = Token & {
    amount: number;
    img: string;
    address: string;
  }
  
  type Pair = {
    id: string;
    token0: Token;
    token1: Token;
    reserve0: string;
    reserve1: string;
    totalSupply: string;
  };
  
  type LiquidityEvent = {
    pair: Pair;
    liquidity: string;
  };
  
  type UserLiquidity = {
    address: string;
    token0: TokenWithAmount;
    token1:  TokenWithAmount;
    balance: BigInt;
  };

  const WETH = "0x005c46f661Baef20671943f2b4c087Df3E7CEb13"; // WETH token address
  const QSWAP = "0x0041A14f8c44Fe623F06b49D20dcb05B5DA130c3"; // QSWAP token address
  
  async function FetchUserLiquidity(userAddress: string): Promise<UserLiquidity[]> {
    const query = `query UserLiquidityDetails {
      pairs {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        reserve0
        reserve1
        totalSupply
      }
    }`;
    
    // const query = `
    //   query UserLiquidityDetails($user: Bytes!) {
    //     mints(where: { to: $user }) {
    //       pair {
    //         id
    //         token0 {
    //           id
    //           symbol
    //           name
    //           decimals
    //         }
    //         token1 {
    //           id
    //           symbol
    //           name
    //           decimals
    //         }
    //         reserve0
    //         reserve1
    //         totalSupply
    //       }
    //       liquidity
    //     }
    //     burns(where: { sender: $user }) {
    //       pair {
    //         id
    //         token0 {
    //           id
    //           symbol
    //           name
    //           decimals
    //         }
    //         token1 {
    //           id
    //           symbol
    //           name
    //           decimals
    //         }
    //         reserve0
    //         reserve1
    //         totalSupply
    //       }
    //       liquidity
    //     }
    //   }
    // `;
  
    const response = await fetch(Config.Subgraph_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { user: userAddress.toLowerCase() },
      }),
    });
  
    const data = await response.json();
  
    const userLiquidity: { [pairId: string]: number } = {};
    const pairs: { [pairId: string]: Pair } = {};
  
    // Process Mints
    // data.data.mints.forEach((mint: LiquidityEvent) => {
    //   const { pair, liquidity } = mint;
    //   const pairId = pair.id;
    //   if (!userLiquidity[pairId]) {
    //     userLiquidity[pairId] = 0;
    //     pairs[pairId] = pair;
    //   }
    //   userLiquidity[pairId] += parseFloat(liquidity);
    // });
  
    // // Process Burns
    // data.data.burns.forEach((burn: LiquidityEvent) => {
    //   const { pair, liquidity } = burn;
    //   const pairId = pair.id;
    //   if (!userLiquidity[pairId]) {
    //     userLiquidity[pairId] = 0;
    //     pairs[pairId] = pair;
    //   }
    //   userLiquidity[pairId] -= parseFloat(liquidity);
    // });

    //
    data.data.pairs.forEach((burn) => {
      
      const pairId = burn.id;
      if (!userLiquidity[pairId]) {
        userLiquidity[pairId] = 0;
        pairs[pairId] = burn;
      }
      // userLiquidity[pairId] -= parseFloat(liquidity);
    });
    //

    // Calculate token amounts
    const results: Promise<UserLiquidity>[] = Object.entries(userLiquidity).map(async ([pairId, liquidity]) => {
      const pair = pairs[pairId];
      const totalSupply = parseFloat(pair.totalSupply);
      const userShare = liquidity / totalSupply;
  
      const token0Amount = userShare * parseFloat(pair.reserve0);
      const token1Amount = userShare * parseFloat(pair.reserve1);
      let img0;
      if (pair.token0.id.toLowerCase() == WETH.toLowerCase()) {
        img0 = tokenList.QUAI.img;
      } else if (pair.token0.id.toLowerCase() == QSWAP.toLowerCase()) {
        img0 = tokenList.QSWAP.img;
      } else {
        img0 = unknownToken;
      }
      let img1;
      if (pair.token1.id.toLowerCase() == WETH.toLowerCase()) {
        img1 = tokenList.QUAI.img;
      } else if (pair.token1.id.toLowerCase() == QSWAP.toLowerCase()) {
        img1 = tokenList.QSWAP.img;
      } else {
        img1 = unknownToken;
      }
      let balance = (await readContract(wagmiConfig, {
        address: quais.getAddress(pair.id) as `0x${string}`,
        abi: pairABI,
        functionName: "balanceOf",
        args: [userAddress]
      })) as BigInt;
      if (balance == 0n) {
        console.log("balance is 0")
        console.log(liquidity)
      }
      return {
        address: pairId,
        token0: { address: pair.token0.id, id: pair.token0.id, symbol: pair.token0.symbol, amount: token0Amount, name: pair.token0.name, decimals: pair.token0.decimals, img: img0 },
        token1: { address: pair.token1.id, id: pair.token1.id, symbol: pair.token1.symbol, amount: token1Amount, name: pair.token1.name, decimals: pair.token1.decimals, img: img1},
        balance: balance,
      };
    });
  
    return Promise.all(results);
  }

  export { FetchUserLiquidity };
