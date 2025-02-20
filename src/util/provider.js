import { usePublicClient } from 'wagmi';
import { BrowserProvider } from 'quais';
import React, { useState, useEffect } from 'react';

function publicClientToProvider(publicClient) {
    const { chain } = publicClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    if (window.pelagus === undefined) {
        return { error: 'Quais not found in window', provider: null };
    }
    return { error: null, provider: new BrowserProvider(window.pelagus, network) };
}

/** Hook to convert a viem Public Client to an ethers.js Provider. */
export function useQuaisProvider({ chainId }) {
    const publicClient = usePublicClient({ chainId });
    const [walletProvider, setProvider] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const { error, provider } = publicClientToProvider(publicClient);

        if (error) {
            setError(error);
            // Retry after 100ms if there's an error
            const retryTimeout = setTimeout(() => {
                const { error, provider } = publicClientToProvider(publicClient);
                if (error) {
                    setError(error);
                } else {
                    setError(null);
                    setProvider(provider);
                }
            }, 200);

            return () => clearTimeout(retryTimeout);  // Cleanup timeout on unmount or when dependencies change
        }

        // If no error, set the provider
        setProvider(provider);
        setError(null);
    }, [publicClient]);

    return { walletProvider, error };
}
