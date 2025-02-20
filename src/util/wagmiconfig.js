import { quai } from "./quaiChain";
import { pelagusWallet } from "./pelagusWallet";
import {createConfig, http} from "wagmi";
import { quais } from 'quais';

const wagmiConfig = createConfig({
    chains: [quai],
    connectors: [
        pelagusWallet(),
    ],
    
    transports: {
        [quai.id]: http(quai.rpcUrls.default.http[0]),
      },
});
export default wagmiConfig;