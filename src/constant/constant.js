export const ChartStatus = {
    notStable: 0,
    isFirstToken: 1,
    isSecondToken: 2
}

export const tokenTemp = {
    "symbol": "",
    "img": "",
    "name": "",
    "address": "",
    "decimals": 18,
    "pumpfun": false
}
export const pairStable =
    [
         "0x0001aac906b14839c83b34364fcf86bae15de553",    //Poop-Qswap
        // "0x005a24c08ef10c092f2848f31d45421a1a41913b"     //Poop-Quai
    ]
export const tokenList = {
    "QUAI": {
        "symbol": "WQUAI",
        "img": "/assets/quai.png",
        "name": "Wrapped QUAI",
        "address": "0x005c46f661Baef20671943f2b4c087Df3E7CEb13",
        "decimals": 18,
        "pumpfun": false
    },
    "QSWAP": {
        "symbol": "QSWAP",
        "img": "/assets/quaiswap.png",
        "name": "QuaiSwap",
        "address": "0x0041A14f8c44Fe623F06b49D20dcb05B5DA130c3",
        "decimals": 18,
        "pumpfun": false
    },
    "POOP": {
        "symbol": "POOP",
        "img": "/assets/poop_logo_rotating_css.gif",
        "name": "Poop.fun",
        "address": "0x0002D28592FDE376DD17445a16222F24E1F4D9d9",
        "decimals": 18,
        "pumpfun": false
    }
}

export const Pairs = {
    "QSWAP/QUAI": "0x00169619a68209c673643912A1B3229072cdb633"
}

export const dataTemp = {
    icon: '',
    image: '',
    core: false,
    earned: 0,
    apr: '',
    liquidity: '',
    multiplier: '',
    contractUrl: "#",
    getUrl: "#",
    pairInfoUrl: "#",
    cakeEarned: 0,
    name: '',
    lpTokenAddress: 0x0000000000000000000000000000000000000000
}
export const LpTemp = {
    token0: {
        "symbol": "",
        "img": "",
        "name": "",
        "address": "",
        "decimals": 18,
        "pumpfun": false
    },
    token1: {
        "symbol": "",
        "img": "",
        "name": "",
        "address": "",
        "decimals": 18,
        "pumpfun": false
    },
    balance: "",
    address: ""
}

export const initialToken = {
    address: '',
    symbol: '',
    decimals: 0,
    name: '',
    img: '',
    pumpfun: false,
};
export const masterchefAddress = "0x005b3EA05F4074515173fE04ff3A2a55723d0D60"; // Uniswap V2 Masterchef contract address
export const stakingAddress = "0x001c2fB39B253f30Dd4B21825809aB3190425fe6"; // Uniswap V2 Masterchef contract address
export const WETH = "0x005c46f661Baef20671943f2b4c087Df3E7CEb13"; // WETH token address
export const factoryAddress = "0x0027e8FA63D05541fdC8B3008c93b840467eD34e"; // Uniswap V2 Factory contract address
export const routerAddress = "0x0065259ea238E73A41FC900F6882BC43f2CDFBBe"; //Uniswap v2 Router contract address
export const Zero = '0x0000000000000000000000000000000000000000';
export const QswapTokenAddress = "0x0041A14f8c44Fe623F06b49D20dcb05B5DA130c3";
export const CurveAddress = '0x00428bC94266f5F6665514ec80A0609eaD8b9376';

export const QswapTokenDecimals = 18;
export const lpTokenDecimals = 18;
