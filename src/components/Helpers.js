import { readContract } from "@wagmi/core";
import { quais } from 'quais'
import wagmiConfig from "../util/wagmiconfig.js";
import erc20ABI from "../assets/abi/IERC20.json";
import { routerAddress } from "../constant/constant";
/* global BigInt */
async function tokenSupportsPermit(tokenAddress, walletAddress) {
    const allowance = await readContract(wagmiConfig,{
        address: tokenAddress,
        abi: erc20ABI,
        functionName: "allowance",
        args: [walletAddress, routerAddress],
    });
    try {
      // If this succeeds (no revert), the token *likely* supports EIP-2612.
      // We'll consider that good enough for "supportsPermit".
      await readContract(wagmiConfig,{
        address: tokenAddress,
        abi: erc20ABI,
        functionName: "nonces",
        args: [walletAddress],
        });
      return { supportsPermit: true, allowance };
    } catch (err) {
      // Any revert or "function not found" error means no permit support
      return { supportsPermit: false, allowance };
    }
  }


  async function signEip2612Permit(tokenAddress, signer, deadline) {
    // 1. Get the domain parameters from token (or hardcode if known)
    //    eip712Domain() => (fields, name, version, chainId, verifyingContract, salt, extensions)
    const [
        fields,
        tokenName,
        tokenVersion,
        chainIdBig,
        verifyingContract,
        salt,
        extensions
      ] = await await readContract(wagmiConfig,{
          address: tokenAddress,
          abi: erc20ABI,
          functionName: "eip712Domain",
        });
    
  
    const domain = {
      name: tokenName,
      version: tokenVersion,
      chainId: Number(chainIdBig),
      verifyingContract
    };
  
    // 2. EIP-2612 Permit type
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };
  
    // 3. Fetch the current nonce for the owner
    const nonce = await readContract(wagmiConfig,{
        address: tokenAddress,
        abi: erc20ABI,
        functionName: "nonces",
        args: [signer.address],
        });
  
    const maxApproval = quais.MaxUint256;
    const message = {
        owner: signer.address,
        spender: routerAddress,       // The UniswapV2Router02 contract
        value: maxApproval,       // how many tokens to permit
        nonce: nonce,                 // from token.nonces(ownerAddress)
        deadline: deadline
    };
  
    // 5. Sign
    const signature = await signer.signTypedData(domain, types, message);
  
    // 6. Split signature
    const { v, r, s } = quais.Signature.from(signature);
  
    return { v, r, s, approveMax: true };
  }

const NEAR_MAX_ALLOWANCE_THRESHOLD = 11579208923731619542357098500868790785326998466564056403945758400791312963993n // 10% of MaxUint256
// or some large “wiggle room,” e.g. 1 million or more

/**
 * Decide if currentAllowance is “close enough” to MaxUint256
 */
function isAllowanceNearInfinite(currentAllowance) {
  // Convert to BigInt if needed
  const allowance = BigInt(currentAllowance.toString());
  const max = BigInt(quais.MaxUint256.toString());
  const threshold = BigInt(NEAR_MAX_ALLOWANCE_THRESHOLD.toString());

  // If allowance >= max - threshold, treat it as infinite
  return allowance >= (max - threshold);
}

  export {tokenSupportsPermit, signEip2612Permit, isAllowanceNearInfinite }