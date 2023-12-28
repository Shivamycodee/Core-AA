import { ethers } from "ethers";
import {
  getCurrnetNonce,
  getUserOperation,
  getTxTimeLimit,
  getSignedPaymasterHash,
  getPaymasterAndData,
  CustomJsonRpcProvider,
} from "./commonFun";
import EntryPointABI from "../assets/abi/EntryPoint.json";
import { EntryPointAddress, PIMLICO_URL, SwapContract } from "../assets/data";
import AbstractSwapABI from "../assets/abi/AbstractSwap.json";

async function tokenSwapPaymaster(SCWAddress, tokenIn, amount, flag) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(SwapContract, AbstractSwapABI, provider);

   const minTx = await contract.populateTransaction.SwapNovice(
     tokenIn,
     amount,
     flag
   );

  const nonce = await getCurrnetNonce(SCWAddress);
  const finalNonce = ethers.utils.hexValue(nonce);

  const timeLimit = getTxTimeLimit();
  const userOperation = await getUserOperation(
    SCWAddress,
    finalNonce,
    SwapContract,
    minTx
  );

  const signedPaymasterHash = await getSignedPaymasterHash(
    userOperation,
    timeLimit
  );

  const paymasterAndData = getPaymasterAndData(signedPaymasterHash, timeLimit);

  userOperation.paymasterAndData = ethers.utils.hexlify(paymasterAndData);

  const singer = provider.getSigner();

  const EntryPoint = new ethers.Contract(
    EntryPointAddress,
    EntryPointABI,
    singer
  );

  const finalUserOpHash = await EntryPoint.getUserOpHash(userOperation);

  const finalUserOpSig = await singer.signMessage(
    ethers.utils.arrayify(finalUserOpHash)
  );

  userOperation.signature = finalUserOpSig;
  console.log("userOperation : ", userOperation);

  try {
    // const tx = await EntryPoint.handleOps(
    //   [userOperation],
    //   VerifyingPaymasterAddress
    // );
    // console.log("tx : ", tx.hash);

    const customProvider = new CustomJsonRpcProvider(PIMLICO_URL);

    const userOpHash = await customProvider.sendUserOperation(
      userOperation,
      EntryPointAddress
    );

    console.log("User Operation Hash:", userOpHash);

    await new Promise((resolve) => setTimeout(resolve, 6000));

    const { receipt } = await customProvider.getTxHashByUserOp(userOpHash);

    const hash = receipt.transactionHash;
    console.log("txHash : ", hash);
    return hash;
  } catch (e) {
    console.error("approve err: ", e);
  }
}

export default tokenSwapPaymaster;
