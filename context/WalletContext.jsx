"use client"

import React, { createContext, useContext, useState,useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ethers, providers } from "ethers";
import ERC20ABI from "../src/assets/abi/ERC20ABI.json";
import {SwapContract,YANGAddress,YINGAddress, CoreTokenAddress} from "../src/assets/data.js";

import {getSCWallet} from "../src/CoreComponents/commonFun"
import TokenApprove from "../src/CoreComponents/tokenApprove.js";
import TokenSwapPaymaster from "../src/CoreComponents/tokenSwapPaymaster";
import TokenSwapERC20Paymaster from "../src/CoreComponents/tokenSwapERC20Paymaster";
import TokenTransferERC20Paymaster from "../src/CoreComponents/tokenTransferERC20Paymaster";

const walletContext = createContext();

export function useGlobalContext() {
  return useContext(walletContext);
}

export default function WalletContextProvider({ children }) {

  const [address, setAddress] = useState(null);
  const [userMatic, setUserMatic] = useState(null);
  const [cFAddress, setCFAddress] = useState("connect wallet");
  const [cFSwapBal, setCFSwapBal] = useState([null, null]);
  const [cFMatic, setCFMatic] = useState(null);
  const [cFERC20, setCFERC20] = useState(null);
  const [swapToken, setSwapToken] = useState(["YING", "YANG"]);
  const [hashList, setHashList] = useState(null);

  const connectWallet = async () => {

    if (!window.ethereum) {
      toast.error("No Wallet Detected.");
      return;
    }

    try {

      const add = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      await getMainBal(add[0]);
      
      toast.success("Wallet Connected");
      return add[0];
      
    } catch (e) {
      toast.error("Wallet Connection Failed");
    }
  };
  
  const getMainBal = async (addr) => {
    let maticBal = await getMaticBalance(addr);
    maticBal = parseFloat(maticBal).toFixed(4);
    setUserMatic(maticBal);
    setAddress(addr);
  };


  const getERC20Contract = (token) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    const provider = new providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(token, ERC20ABI, signer);
    return contract;
  };

  const getMaticBalance = async (add) => {

    if(add == ethers.constants.AddressZero)
      return 0;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balanceWei = await provider.getBalance(add);
    const balanceMatic = ethers.utils.formatEther(balanceWei);
    return balanceMatic;
  };

  const checkAllowance = async (token) => {

    const erc20Contract = getERC20Contract(token);
    const allowance = await erc20Contract.allowance(
      cFAddress,
      SwapContract
    );
    let allowanceFormatted = ethers.utils.formatEther(allowance);
    allowanceFormatted = parseInt(allowanceFormatted);

    if (allowanceFormatted < 1000) {
      return false;
    } else return true;
  };

  const approveToken = async (token,toApprove) => {
    
    const toastId = toast.loading("Processing Approval...");

    try {

      const txHash = await TokenApprove(cFAddress, token, toApprove);
      // Dismiss the loading toast
      toast.dismiss(toastId);
      let link = "https://mumbai.polygonscan.com/tx/" + txHash;
      setHashList(link);
      toast.success("Approval Successful");
    } catch (error) {
      // Dismiss the loading toast
      toast.dismiss(toastId);
      console.error("Error during Approval:", error);
      toast.error("Approval failed. Please try again.");
    }
  };

  const ProfessionalSwap = async (tokenIn, amount, flag) => {

    let amt = ethers.utils.parseEther(amount.toString());
    const toastId = toast.loading("Processing transaction...");

    try {

      const txHash = await TokenSwapPaymaster(cFAddress, tokenIn, amt, flag);

      toast.dismiss(toastId);
      let link = "https://mumbai.polygonscan.com/tx/" + txHash;
      setHashList(link);
      toast.success("Transaction Successful");
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error during transaction:", error);
      toast.error("Transaction failed. Please try again.");
    }
  };

  const ERC20ProfessionalSwap = async (tokenIn, amount, flag) => {

    let amt = ethers.utils.parseEther(amount.toString());
    const toastId = toast.loading("Processing transaction...");

    try {

      const txHash = await TokenSwapERC20Paymaster(
        cFAddress,
        tokenIn,
        amt,
        flag
      );

      toast.dismiss(toastId);
      let link = "https://mumbai.polygonscan.com/tx/" + txHash;
      setHashList(link);
      toast.success("Transaction Successful");
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error during transaction:", error);
      toast.error("Transaction failed. Please try again.");
    }
  };

 const tokenTransferERC20 = async(to,amount)=>{

    let amt = ethers.utils.parseEther(amount.toString());
    const toastId = toast.loading("Processing transaction...");

    try {
      const txHash = await TokenTransferERC20Paymaster(
        cFAddress,
        CoreTokenAddress,
        to,
        amt
      );

      toast.dismiss(toastId);
      let link = "https://mumbai.polygonscan.com/tx/" + txHash;
      setHashList(link);
      toast.success("Transaction Successful");
      return  txHash;
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error during transaction:", error);
      toast.error("Transaction failed. Please try again.");
    }

 }


  const handleSCW = async () => {
    const tempAdd = await getSCWallet(address);
    setCFAddress(tempAdd);
    if (tempAdd !== ethers.constants.AddressZero)
         await SCABalanceHandler(tempAdd);
  };

  const SCABalanceHandler = async (tempAddress) => {

    let maticBal = await getMaticBalance(tempAddress);
    maticBal = parseFloat(maticBal).toFixed(4);
    setCFMatic(maticBal);

    const erc20Contract = getERC20Contract(CoreTokenAddress);
    const erc20Bal = await erc20Contract.balanceOf(tempAddress);
    let erc20BalFormatted = ethers.utils.formatUnits(erc20Bal, 18);
    erc20BalFormatted = parseFloat(erc20BalFormatted).toFixed(4);
    setCFERC20(erc20BalFormatted);

    const ying20Contract = getERC20Contract(YINGAddress);
    const ying20Bal = await ying20Contract.balanceOf(tempAddress);
    let ying20BalFormatted = ethers.utils.formatEther(ying20Bal);
    ying20BalFormatted = parseFloat(ying20BalFormatted).toFixed(4);

    const yang20Contract = getERC20Contract(YANGAddress);
    const yang20Bal = await yang20Contract.balanceOf(tempAddress);
    let yang20BalFormatted = ethers.utils.formatEther(yang20Bal);
    yang20BalFormatted = parseFloat(yang20BalFormatted).toFixed(4);

    setCFSwapBal([ying20BalFormatted, yang20BalFormatted]);
  };


  useEffect(() => {
    connectWallet();
  }, []);

 useEffect(() => {
if(address){
    handleSCW();
  }
}, [address]);
  
 useEffect(() => {
   if (cFAddress && address) {
     SCABalanceHandler(cFAddress);
     const interval = setInterval(() => {
       SCABalanceHandler(cFAddress);
     }, 1000*7); 
     return () => clearInterval(interval);
   }
 }, [cFAddress, address]);


  return (
    <walletContext.Provider
      value={{
        connectWallet,
        address,
        setAddress,
        swapToken,
        setSwapToken,
        cFAddress,
        cFMatic,
        cFERC20,
        setCFAddress,
        checkAllowance,
        approveToken,
        cFSwapBal,
        userMatic,
        ProfessionalSwap,
        hashList,
        ERC20ProfessionalSwap,
        tokenTransferERC20,
      }}
    >
      <Toaster />
      {children}
    </walletContext.Provider>
  );
}
