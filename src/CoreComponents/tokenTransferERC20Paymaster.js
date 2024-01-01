import { ethers } from "ethers";
import ERC20ABI from "../assets/abi/ERC20ABI.json";
import {
  getUserOperation,
  CustomJsonRpcProvider,
  waitForReceipt,
  getSignedUserOp,
} from "./commonFun";
import { EntryPointAddress, PIMLICO_URL } from "../assets/data";

async function tokenTransferERC20Paymaster(SCWAddress, tokenIn,to, amount) {

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(tokenIn, ERC20ABI, provider);
  const customProvider = new CustomJsonRpcProvider(PIMLICO_URL);

  const minTx = await contract.populateTransaction.transfer(to, amount);
  const userOperation = await getUserOperation(
    SCWAddress,
    tokenIn,
    minTx
  );

  const signedUserOperation = await getSignedUserOp(userOperation,false);
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

export default tokenTransferERC20Paymaster;
