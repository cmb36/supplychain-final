import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

const Web3Context = createContext(undefined);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [manualDisconnect, setManualDisconnect] = useState(false);

  // Refs para acceder a valores actuales en listeners
  const manualDisconnectRef = useRef(manualDisconnect);
  
  useEffect(() => {
    manualDisconnectRef.current = manualDisconnect;
  }, [manualDisconnect]);

  const setupProvider = async (ethereum) => {
    const browserProvider = new BrowserProvider(ethereum);
    const signer = await browserProvider.getSigner();
    const supplyChainContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    setProvider(browserProvider);
    setContract(supplyChainContract);

    return { browserProvider, supplyChainContract };
  };

  const loadUserInfo = async (address, supplyChainContract) => {
    try {
      // Cargar admin info
      const adminAddr = await supplyChainContract.admin();
      const hasAdminValue = await supplyChainContract.hasAdmin();
      
      setHasAdmin(hasAdminValue);

      // Verificar si es admin
      if (adminAddr && adminAddr !== '0x0000000000000000000000000000000000000000') {
        const isAdminByAddress = adminAddr.toLowerCase() === address.toLowerCase();
        
        try {
          const userData = await supplyChainContract.getUserByAddress(address);
          const userRole = Number(userData.role);
          const isAdminByRole = userRole === 5;
          
          setIsAdmin(isAdminByAddress || isAdminByRole);
        } catch {
          setIsAdmin(isAdminByAddress);
        }
      } else {
        setIsAdmin(false);
      }

      // Cargar datos del usuario
      try {
        const userData = await supplyChainContract.getUserByAddress(address);
        
        if (userData.id === 0n) {
          setUser(null);
        } else {
          // Convertir BigInt a Number para evitar errores de serialización
          const normalizedUser = {
            id: Number(userData.id),
            wallet: userData.wallet,
            role: Number(userData.role),
            status: Number(userData.status),
          };
          setUser(normalizedUser);
        }
      } catch (error) {
        if (error?.message?.includes("No user")) {
          setUser(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Por favor instala MetaMask');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      setAccount(address);
      setIsConnected(true);
      setManualDisconnect(false);

      localStorage.setItem('connectedAccount', address);

      const { supplyChainContract } = await setupProvider(window.ethereum);
      await loadUserInfo(address, supplyChainContract);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    setManualDisconnect(true);
    
    setAccount(null);
    setIsConnected(false);
    setIsAdmin(false);
    setUser(null);
    setProvider(null);
    setContract(null);
    
    localStorage.removeItem('connectedAccount');

    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.warn('Error revoking permissions:', error);
    }

    localStorage.clear();
    sessionStorage.clear();
    
    window.location.reload();
  };

  const refreshUser = async () => {
    if (!account || !contract) return;
    await loadUserInfo(account, contract);
  };

  // Restaurar sesión desde localStorage
  useEffect(() => {
    const restoreSession = async () => {
      if (!window.ethereum) return;

      try {
        const savedAccount = localStorage.getItem('connectedAccount');
        if (!savedAccount) return;

        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length === 0) {
          localStorage.removeItem('connectedAccount');
          return;
        }

        const currentAccount = accounts[0];
        if (savedAccount.toLowerCase() === currentAccount.toLowerCase()) {
          setAccount(currentAccount);
          setIsConnected(true);
          const { supplyChainContract } = await setupProvider(window.ethereum);
          await loadUserInfo(currentAccount, supplyChainContract);
        } else {
          localStorage.removeItem('connectedAccount');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('connectedAccount');
      }
    };

    restoreSession();
  }, []);

  // Listeners de MetaMask - SOLO SE EJECUTA UNA VEZ
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (manualDisconnectRef.current) return;

      if (accounts.length === 0) {
        await disconnectWallet();
      } else {
        const newAccount = accounts[0];
        
        setAccount(newAccount);
        setIsConnected(true);
        setManualDisconnect(false);

        localStorage.setItem('connectedAccount', newAccount);

        try {
          const { supplyChainContract } = await setupProvider(window.ethereum);
          await loadUserInfo(newAccount, supplyChainContract);
        } catch (error) {
          console.error('Error cargando datos:', error);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        isConnected,
        isAdmin,
        user,
        hasAdmin,
        provider,
        contract,
        connectWallet,
        disconnectWallet,
        refreshUser,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

