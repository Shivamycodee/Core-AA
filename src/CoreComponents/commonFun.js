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
  const nonce = await contract.getNonce(address,0);
  return nonce;
    
} 

const getUserOperation = async (SCWAddress,NONCE,callContract,minTx) => {

  const provider = new ethers.providers.Web3Provider(window.ethereum);


  const simpleAccount = new ethers.Contract(
        SCWAddress,
        SimpleAccountABI,
        provider
      );

  const userOperation = {
    sender: SCWAddress,
    nonce: NONCE,
    initCode: "0x",
    callData: simpleAccount.interface.encodeFunctionData("execute", [
      callContract,
      0,
      minTx.data,
    ]),
    callGasLimit: 112489,
    verificationGasLimit: 87538,
    preVerificationGas: 93636,
    maxFeePerGas: 100_000_000_000,
    maxPriorityFeePerGas: 100_000_000_000,
    paymasterAndData: "0x",
    signature: "0x",
  };

  if(SCWAddress == ethers.constants.AddressZero){

    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const res = await getInitCode(address);

    // userOperation.initCode = res[0];
    userOperation.sender = res[1];

  }


  console.log("userOperation : ", userOperation);

  return userOperation;


};

const getUserOpHash = async (op, entryPoint, chainId) => {

  const userOpHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "uint256",
        "bytes",
        "bytes",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes",
      ],
      [
        op.sender,
        op.nonce,
        op.initCode,
        op.callData,
        op.callGasLimit,
        op.verificationGasLimit,
        op.preVerificationGas,
        op.maxFeePerGas,
        op.maxPriorityFeePerGas,
        op.paymasterAndData,
      ]
    )
  );
  const enc = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "address", "uint256"],
    [userOpHash, entryPoint, BigInt(chainId)]
  );

  return ethers.utils.keccak256(enc);
};


function getTxTimeLimit() {
  const currentTime = Math.floor(Date.now() / 1000); // mili to sec
  const tenMinutesLater = currentTime;
  return [currentTime + 3600, tenMinutesLater];
}

function getPaymasterAndData(signedPaymasterHash, timeLimit) {

  const paymasterAndData = ethers.utils.concat([
    VerifyingPaymasterAddress,
    ethers.utils.defaultAbiCoder.encode(
      ["uint48", "uint48"],
      [timeLimit[0], timeLimit[1]]
    ),
    signedPaymasterHash,
  ]);
  return paymasterAndData;
}

function getERC20PaymasterAndData(
  priceSource,
  paymasterSignature,
  timeLimit,
  exchangeRate,
  priceMarkup
) {

  const priceSourceBytes = numberToHexString(priceSource);

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

  return paymasterAndData;
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



export {
  getTxTimeLimit,
  getPaymasterAndData,
  getERC20PaymasterAndData,
  numberToHexString,
  getCurrnetNonce,
  getSCWallet,
  getUserOperation,
  getSignedPaymasterHash,
  CustomJsonRpcProvider,
  getSignedERC20PaymasterHash,
  getInitCode,
  waitForReceipt,
};