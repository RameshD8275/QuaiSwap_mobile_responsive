export const quai = {
    id: 15000,
    name: 'Quai',
    nativeCurrency: { name: 'Quai', symbol: 'QUAI', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://node.quaiswap.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'QuaiScan',
            url: 'https://orchard.quaiscan.io',
            apiUrl: 'https://api.orchard.quaiscan.io/api',
        },
    },
    contracts: {
        multicall3: {
            address: '0x0044E4779b3e1C88f931DE4940bC87C1a85628c3',
            blockCreated: 1,
        },
    },
};