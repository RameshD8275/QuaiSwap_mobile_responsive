
import { createConnector } from '@wagmi/core';
import { quais } from 'quais';

export function pelagusWallet() {
    return createConnector(({ emitter }) => {
        // Create the provider using Quais and Pelagus
        const provider =
            typeof window !== 'undefined' && window.pelagus
            ? new quais.BrowserProvider(window.pelagus)
            : undefined;
        
        console.log("[pelagusWallet] provider:", provider);

        // Event handlers
        const onAccountsChanged = async(accounts) => {
            console.log("[pelagusWallet] onAccountsChanged", accounts);
            if (accounts.length === 0) {
                if (provider == null) {
                    console.log("Pelagus wallet not found");
                    window.location.reload();
                } 
                accounts = await provider.send('quai_requestAccounts', []);
                if (accounts.length === 0) {
                    // refresh page
                    window.location.reload();
                }
            }
            emitter.emit('change', { accounts });
        };

        const onChainChanged = (chainIdHex) => {
            console.log("[pelagusWallet] onChainChanged", chainIdHex);
            const chainId = parseInt(chainIdHex, 16);
            emitter.emit('change', { chainId });
        };

        const onDisconnect = () => {
            console.log("[pelagusWallet] onDisconnect");
            emitter.emit('disconnect');
        };

        // Setup event listeners
        const setupListeners = () => {
            if (!window.pelagus?.on) return;

            window.pelagus.on('accountsChanged', onAccountsChanged);
            window.pelagus.on('chainChanged', onChainChanged);
            window.pelagus.on('disconnect', onDisconnect);
        };

        // Remove event listeners
        const removeListeners = () => {
            if (!window.pelagus?.removeListener) return;

            window.pelagus.removeListener('accountsChanged', onAccountsChanged);
            window.pelagus.removeListener('chainChanged', onChainChanged);
            window.pelagus.removeListener('disconnect', onDisconnect);
        };

        // Methods
        const connect = async (config) => {
            const provider = new quais.BrowserProvider(window.pelagus)
            console.log("[pelagusWallet] connect", config);
            if (!provider) {
                console.log("Pelagus wallet not found");
                throw new Error('Pelagus wallet not found');
            }

            // Get accounts using provider.send
            const accounts = await provider.send('quai_requestAccounts', []);
            if (!accounts || accounts.length === 0) {
                console.log("No accounts found");
                throw new Error('No accounts found');
            }
            console.log("[pelagusWallet] Accounts:", accounts);

            // Get chain ID
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);

            // Set up event listeners
            setupListeners();

            emitter.emit('connect', { chainId, accounts });

            return {
                accounts,
                chainId,
            };
        };

        const disconnect = async () => {
            console.log("[pelagusWallet] disconnect");
            // Pelagus might not support programmatic disconnect
            // Remove event listeners
            removeListeners();

            emitter.emit('disconnect');
        };

        const getAccount = async () => {
            if (!provider) throw new Error('Pelagus wallet not found');
            const accounts = await provider.send('quai_accounts', []);
            return accounts[0];
        };

        const getAccounts = async () => {
            if (!provider) throw new Error('Pelagus wallet not found');
            const accounts = await provider.send('quai_accounts', []);
            return accounts;
        };

        const getChainId = async () => {
            if (!provider) throw new Error('Pelagus wallet not found');
            const network = await provider.getNetwork();
            return Number(network.chainId);
        };

        const getProvider = async () => {
            return provider;
        };

        const isAuthorized = async () => {
            if (!provider) return false;
            try {
                const accounts = await provider.send('quai_accounts', []);
                return accounts && accounts.length > 0;
            } catch {
                return false;
            }
        };
        
        return {
            id: 'pelagus',
            name: 'Pelagus',
            icon: '', // Optional icon URL
            type: 'pelagus',
            ready: typeof window !== 'undefined' && !!window.pelagus,
            connect,
            disconnect,
            getAccount,
            getAccounts,
            getChainId,
            getProvider,
            isAuthorized,
            // Events
            onAccountsChanged,
            onChainChanged,
            onDisconnect,
            setupListeners,
            removeListeners,
        };
    });
}