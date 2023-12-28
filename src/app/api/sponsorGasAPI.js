import {ethers} from "ethers";
import SwapData from "../../assets/data.js"
import ERC20ABI from "../../assets/abi/ERC20ABI.json";
import AbstractSwap from '../../assets/abi/AbstractSwap.json'

const GAS_MANAGER_POLICY_ID = SwapData.ALCHEMY_POLICYID

const AlchemyApprove = async (provider,token) => {


  const erc20Contract = new ethers.Contract(token, ERC20ABI);
  const encodedData = erc20Contract.interface.encodeFunctionData("approve", [
    SwapData.SwapContract,
    ethers.constants.MaxUint256,
  ]);

  provider.withAlchemyGasManager({
    policyId: GAS_MANAGER_POLICY_ID,
  });

  console.log("---Approve API GOOD TILL HERE---")
  
  const res = await provider.sendUserOperation({
    target: token,
    data: encodedData,
  });

  console.log("Approve res: ",res)

  return res.hash;

};


const AlchemySponsorSwap = async (provider, tokenIn,amt,flag) => {

  const erc20Contract = new ethers.Contract(tokenIn, AbstractSwap);

  const encodedData = erc20Contract.interface.encodeFunctionData("SwapNovice", [
    tokenIn,amt,flag
  ]);

  provider.withAlchemyGasManager({
    policyId: GAS_MANAGER_POLICY_ID,
  });

  console.log("---SWAP GOOD TILL HERE---");

  const res = await provider.sendUserOperation({
    target: SwapData.SwapContract,
    data: encodedData,
  });

  console.log("SponsorSwap : ",res);

  return res.hash;
};



export { AlchemyApprove, AlchemySponsorSwap };
