import { ethers } from "ethers";
import ERC20ABI from "../assets/abi/ERC20ABI.json";
import {
  getCurrnetNonce,
  getUserOperation,
  getTxTimeLimit,
  getSignedERC20PaymasterHash,
  getERC20PaymasterAndData,
  CustomJsonRpcProvider,
} from "./commonFun";
import EntryPointABI from "../assets/abi/EntryPoint.json";
import { EntryPointAddress, PIMLICO_URL } from "../assets/data";

async function tokenTransferERC20Paymaster(SCWAddress, tokenIn,to, amount) {

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(tokenIn, ERC20ABI, provider);

  const singer = provider.getSigner();
  const EntryPoint = new ethers.Contract(
    EntryPointAddress,
    EntryPointABI,
    singer
  );

  const minTx = await contract.populateTransaction.transfer(to, amount);

  const nonce = await getCurrnetNonce(SCWAddress);
  const finalNonce = ethers.utils.hexValue(nonce);

  const timeLimit = getTxTimeLimit();
  const userOperation = await getUserOperation(
    SCWAddress,
    finalNonce,
    tokenIn,
    minTx
  );

  const signedPaymasterHash = await getSignedERC20PaymasterHash(
    userOperation,
    timeLimit
  );

  const paymasterAndData = getERC20PaymasterAndData(
    1,
    signedPaymasterHash,
    timeLimit,
    ethers.utils.parseUnits("1", 16),
    1e6 + 1e4
  );
  userOperation.paymasterAndData = ethers.utils.hexlify(paymasterAndData);

  const finalUserOpHash = await EntryPoint.getUserOpHash(userOperation);
  const finalUserOpSig = await singer.signMessage(
    ethers.utils.arrayify(finalUserOpHash)
  );

  userOperation.signature = finalUserOpSig;
  console.log("userOperation : ", userOperation);

  try {

    const customProvider = new CustomJsonRpcProvider(PIMLICO_URL);
    const userOpHash = await customProvider.sendUserOperation(
      userOperation,
      EntryPointAddress
    );

    console.log("User Operation Hash:", userOpHash);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const { receipt } = await customProvider.getTxHashByUserOp(userOpHash);

    const hash = receipt.transactionHash;
    console.log("txHash : ", hash);
    return hash;
  } catch (e) {
    console.error("approve err: ", e);
  }
}

export default tokenTransferERC20Paymaster;
