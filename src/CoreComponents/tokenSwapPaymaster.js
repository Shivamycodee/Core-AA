import { ethers } from "ethers";
import {
  getUserOperation,
getSignedUserOp,
  CustomJsonRpcProvider,
  waitForReceipt,
} from "./commonFun";
import {
  EntryPointAddress,
  PIMLICO_URL,
  SwapContract,
} from "../assets/data";
import AbstractSwapABI from "../assets/abi/AbstractSwap.json";

async function tokenSwapPaymaster(SCWAddress, tokenIn, amount, flag) {


  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(SwapContract, AbstractSwapABI, provider);
  const customProvider = new CustomJsonRpcProvider(PIMLICO_URL);

   const minTx = await contract.populateTransaction.SwapNovice(
     tokenIn,
     amount,
     flag
   );

  const userOperation = await getUserOperation(
    SCWAddress,
    SwapContract,
    minTx
  );

  const signedUserOperation = await getSignedUserOp(userOperation,true);
  console.log("signedUserOperation : ", signedUserOperation);


  try {
    const userOpHash = await customProvider.sendUserOperation(
      signedUserOperation,
      EntryPointAddress
    );

    console.log("User Operation Hash:", userOpHash);

     const res = await waitForReceipt(customProvider, userOpHash);
     const hash = res.receipt.transactionHash;
     console.log("txHash : ", hash);
     return hash;
  } catch (e) {
    console.error("approve err: ", e);
  }
}

export default tokenSwapPaymaster;
