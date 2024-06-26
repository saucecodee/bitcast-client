import { ethers } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import AuthService from "./services/authService";
import httpService, {
  getAuthUser,
  shortenAddress,
} from "./services/httpService";
import { toast } from "sonner";

type appContextType = {
  authUser: AuthUser | null;
  setAuthUser: (formState: AuthUser | null) => void;
  signMessage: () => void;
  signout: () => void;
};

const appContextDefaultValues: appContextType = {
  authUser: null,
  setAuthUser: () => null,
  signMessage: () => null,
  signout: () => null,
};

const AppContext = createContext<appContextType>(appContextDefaultValues);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const ethereum = window.ethereum;

  const handleAccountsChanged = (accounts: string[]) => {
    setAuthUser(null);
    httpService.deleteAuthUser();
    if (accounts[0])
      toast.info(`Account switched to ${shortenAddress(accounts[0])}`);
  };

  const signMessage = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum); // Connect to Ethereum provider
      await window.ethereum.enable(); // Request access to user's accounts
      const signer = await provider.getSigner(); // Get the signer
      const message = "Sign into Bitcast App";
      const signature = await signer.signMessage(message); // Sign the message
      const signerAddress = await signer.getAddress();

      const result = await AuthService.auth({
        message,
        signature,
        signerAddress,
      });

      if (!result.data.data) return toast.error("Signin was unsuccessfil");

      setAuthUser(result.data.data);
      toast.success("Signin sucessfull");
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "reason" in error &&
        error?.reason == "rejected"
      ) {
        toast.error("Signature request was rejected");
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const signout = () => {
    httpService.deleteAuthUser();
    setAuthUser(null);
  };

  useEffect(() => {
    (async () => {
      const authUser = getAuthUser();
      setAuthUser(authUser.access_token ? authUser : null);

      ethereum.on("accountsChanged", handleAccountsChanged);

      ethereum.on("connect", () => {
        toast.info(`Account connected`);
      });

      ethereum.on("disconnect", () => {
        setAuthUser(null);
        httpService.deleteAuthUser();
        toast.info("Wallet disconnected");
      });
    })();
    
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener("connect", () => {});
      ethereum.removeListener("disconnect", () => {});
    };
  }, []);

  return (
    <AppContext.Provider
      value={{ authUser, setAuthUser, signMessage, signout }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) throw new Error("useApp must be used inside a `AppProvider`");

  return context;
}
