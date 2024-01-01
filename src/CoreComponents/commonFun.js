import { ethers } from "ethers";
import EntryPointABI from "../assets/abi/EntryPoint.json";
import {
  EntryPointAddress,
  SimpleAccountFactoryAddress,
  VerifyingPaymasterAddress,
  POOL_PRIVATE_KEY,
  MUMBAI_URL,
  ERC20VerifierAddress,
  OracleAggregator,
  CoreTokenAddress,
  SAFEPOOL_PRV_KEY,
  PIMLICO_URL,
  GAS_FETCH_PRV,
} from "../assets/data";
import  SimpleAccountFactoryABI from "../assets/abi/SimpleAccountFactory.json"
import SimpleAccountABI from "../assets/abi/SimpleAccount.json";
import VerifyingPaymasterABI from "../assets/abi/VerifyingPaymaster.json";
import ERC20VerifyingPaymasterABI from "../assets/abi/ERC20VerifyingPaymaster.json";

const getSCWallet = async (address) => {

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(
    SimpleAccountFactoryAddress,
    SimpleAccountFactoryABI,
    provider
  );
  const wallet = await contract.createdAccounts(address,0);
  return wallet;



}

const getCurrnetNonce = async (address) => {

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const contract = new ethers.Contract(
    EntryPointAddress,
    EntryPointABI,
    provider
  );
  const _nonce = await contract.getNonce(address,0);
  const nonce = ethers.utils.hexValue(_nonce);
  return nonce;
    
} 

const getUserOperation = async (SCWAddress,callContract,minTx) => {

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const simpleAccount = new ethers.Contract(
        SCWAddress,
        SimpleAccountABI,
        provider
      );

  const NONCE = await getCurrnetNonce(SCWAddress);

  const userOperation = {
    sender: SCWAddress,
    nonce: NONCE,
    initCode: "0x",
    callData: simpleAccount.interface.encodeFunctionData("execute", [
      callContract,
      0,
      minTx.data,
    ]),
    callGasLimit: 0, // 124651
    verificationGasLimit: 0, // 61714
    preVerificationGas: 0, // 44752
    maxFeePerGas: 70_000_000_000,
    maxPriorityFeePerGas: 50_000_000_000,
    paymasterAndData: "0x",
    signature: "0x",
  };

  if (SCWAddress == ethers.constants.AddressZero) {

    console.log("DEPLOYEING CONTRACT WALLET...")

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const res = await getInitCode(address);

      // userOperation.initCode = res[0];
      userOperation.sender = res[1];
    }


    
  const signPaymasterAndData = await getPaymasterAndData(userOperation);
  userOperation.paymasterAndData = signPaymasterAndData.paymasterAndData;
    
  const res = await fetchGasValues(userOperation);  
  userOperation.callGasLimit = res[0].toNumber();
  userOperation.verificationGasLimit = res[1].toNumber() + 10000;
  userOperation.preVerificationGas = res[2].toNumber();
    
  console.log("userOperation : ", userOperation);
  return userOperation;


};

function getTxTimeLimit() {
  const currentTime = Math.floor(Date.now() / 1000); // mili to sec
  const tenMinutesLater = currentTime;
  return [currentTime + 3600, tenMinutesLater];
}

async function getPaymasterAndData(userOperation) {

  const timeLimit = getTxTimeLimit();
  const signedPaymasterHash = await getSignedPaymasterHash(
    userOperation,
    timeLimit
  );

  const paymasterAndData = ethers.utils.concat([
    VerifyingPaymasterAddress,
    ethers.utils.defaultAbiCoder.encode(
      ["uint48", "uint48"],
      [timeLimit[0], timeLimit[1]]
    ),
    signedPaymasterHash,
  ]);

  userOperation.paymasterAndData = ethers.utils.hexlify(paymasterAndData);
  return userOperation;
}

async function getERC20PaymasterAndData(userOperation) {

  const timeLimit = getTxTimeLimit();
  const paymasterSignature = await getSignedERC20PaymasterHash(
    userOperation,
    timeLimit
  );
  const priceSource = 1;
  const exchangeRate = ethers.utils.parseUnits("1", 16);
  const priceSourceBytes = numberToHexString(priceSource);
  const priceMarkup = 1e6 + 1e4;

  const paymasterAndData = ethers.utils.concat([
    ERC20VerifierAddress,
    priceSourceBytes,
    ethers.utils.defaultAbiCoder.encode(
      ["uint48", "uint48", "address", "address", "uint256", "uint32"],
      [
        timeLimit[0],
        timeLimit[1],
        CoreTokenAddress,
        OracleAggregator,
        exchangeRate,
        priceMarkup,
      ]
    ),
    paymasterSignature,
  ]);
  
  userOperation.paymasterAndData = ethers.utils.hexlify(paymasterAndData);
  return userOperation;
}


function numberToHexString(number) {
  if (number < 0) {
    throw new Error("Number must be positive");
  }
  let hexString = number.toString(16);
  // Ensure even number of characters (pad with a leading zero if necessary)
  if (hexString.length % 2 !== 0) {
    hexString = "0" + hexString;
  }
  return "0x" + hexString;
}


const getSignedPaymasterHash = async (userOp, timeLimit) => {

  const provider = new ethers.providers.JsonRpcProvider(MUMBAI_URL);
  const wallet = new ethers.Wallet(POOL_PRIVATE_KEY, provider);

  const paymasterContract = new ethers.Contract(
    VerifyingPaymasterAddress,
    VerifyingPaymasterABI,
    provider 
  );
  const paymasterHash = await paymasterContract.getHash(
    userOp,
    timeLimit[0],
    timeLimit[1]
  );

  const paymasterSignature = await wallet.signMessage(
    ethers.utils.arrayify(paymasterHash)
    );

    console.log("paymasterSignature : ", paymasterSignature); 
    
  return paymasterSignature;
};


const getSignedERC20PaymasterHash = async (userOp, timeLimit) => {

  const provider = new ethers.providers.JsonRpcProvider(MUMBAI_URL);
  const wallet = new ethers.Wallet(SAFEPOOL_PRV_KEY, provider);

  const paymasterContract = new ethers.Contract(
    ERC20VerifierAddress,
    ERC20VerifyingPaymasterABI,
    provider
  );

  const paymasterHash = await paymasterContract.getHash(
    userOp,
    "1",
    timeLimit[0],
    timeLimit[1],
    CoreTokenAddress,
    OracleAggregator,
    ethers.utils.parseUnits("1", 16),
    "1010000"
  );

  console.log("ERC20paymasterHash : ", paymasterHash);

  const paymasterSignature = await wallet.signMessage(
    ethers.utils.arrayify(paymasterHash)
  );
  
  console.log("ERC20paymasterSignature : ", paymasterSignature);

  return paymasterSignature;
};


const getInitCode = async(address)=>{

  // initCode: hexConcat([contract.address, factory.interface.encodeFunctionData('createAccount', [await signer.getAddress(), 0])]),
  // factory = contract = simpleAccountFactory

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    SimpleAccountFactoryAddress,
    SimpleAccountFactoryABI,
    signer
  );


  // const initCode = ethers.utils.hexConcat([
  //   SimpleAccountFactoryAddress,
  //   contract.interface.encodeFunctionData("createAccount",[address,0]),
  // ]);
  const initCode = "0x";
  
  await contract.createAccount(address,0);
  const _SCWAddress = await contract.getAddress(address,0);
  console.log("SCWAddress : ", _SCWAddress);

  return [initCode, _SCWAddress];

}

const fetchGasValues = async (userOperation)=>{

    const tempProvider = new ethers.providers.JsonRpcProvider(MUMBAI_URL);
    const tempWallet = new ethers.Wallet(GAS_FETCH_PRV, tempProvider);

    const EntryPoint = new ethers.Contract(
      EntryPointAddress,
      EntryPointABI,
      tempWallet
    );
     
    const finalUserOpHash = await EntryPoint.getUserOpHash(userOperation);
    const finalUserOpSig = await tempWallet.signMessage(
      ethers.utils.arrayify(finalUserOpHash)
    );

    userOperation.signature = finalUserOpSig;
    const customProvider = new CustomJsonRpcProvider(PIMLICO_URL);

     const respond = await customProvider.getUserOperationGasEstimate(
       userOperation
     );

    const callGasLimit = ethers.BigNumber.from(respond.callGasLimit);
    const verificationGasLimit = ethers.BigNumber.from(respond.verificationGasLimit);
    const preVerificationGas = ethers.BigNumber.from(respond.preVerificationGas);
    return [callGasLimit, verificationGasLimit, preVerificationGas];

}


function convertBigIntToString(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "bigint") {
      obj[key] = obj[key].toString();
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      convertBigIntToString(obj[key]);
    }
  }
}

class CustomJsonRpcProvider extends ethers.providers.JsonRpcProvider {

  async sendUserOperation(userOperation, entryPoint) {
    const method = "eth_sendUserOperation";
    // Convert BigInt to string
    convertBigIntToString(userOperation);
    const params = [userOperation, entryPoint];
    return this.send(method, params);
  }

  async getTxHashByUserOp(userOpHash) {
    const method = "eth_getUserOperationReceipt";
    // Convert BigInt to string
    const params = [userOpHash];
    return this.send(method, params);
  }

  async getUserOperationGasEstimate(userOperation){
    const method = "eth_estimateUserOperationGas";
    const params = [userOperation,EntryPointAddress];
    return this.send(method, params);
  }


}

async function waitForReceipt(
  customProvider,
  userOpHash,
  interval = 1000,
  timeout = 60000
) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const res = await customProvider.getTxHashByUserOp(userOpHash);
      if (res) return res;
    } catch (error) {
      // Optionally handle specific errors
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error("Transaction res not found within timeout period");
}


async function getSignedUserOp(userOperation,flag) {

 if(flag){
   console.log("using paymaster...")
   userOperation = await getPaymasterAndData(userOperation);
  }
  else{
    console.log("using ERC20 paymaster...")
    userOperation = await getERC20PaymasterAndData(userOperation);
  }
  
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const EntryPoint = new ethers.Contract(
    EntryPointAddress,
    EntryPointABI,
    signer
  );

  const finalUserOpHash = await EntryPoint.getUserOpHash(userOperation);
  const finalUserOpSig = await signer.signMessage(
    ethers.utils.arrayify(finalUserOpHash)
  );

  userOperation.signature = finalUserOpSig;
  return userOperation;
}


export {
  getPaymasterAndData,
  getERC20PaymasterAndData,
  numberToHexString,
  getSCWallet,
  getUserOperation,
  getSignedPaymasterHash,
  CustomJsonRpcProvider,
  getSignedUserOp,
  getSignedERC20PaymasterHash,
  getInitCode,
  waitForReceipt,
};