import SwapData from '../../assets/data.js'
import { LightSmartContractAccount,
  getDefaultLightAccountFactoryAddress,
} from "@alchemy/aa-accounts";
import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { LocalAccountSigner} from "@alchemy/aa-core";
import { polygonMumbai } from "viem/chains";
import {ethers} from "ethers";

const chain = polygonMumbai;

// const PRIVATE_KEY = SwapData.POOL_PRIVATE_KEY;
// const eoaSigner =
//   LocalAccountSigner.privateKeyToAccountSigner(`0x${PRIVATE_KEY}`);


class MetaMaskSmartAccountSigner {
  constructor(signer) {
    this.signer = signer;
  }

  get signerType() {
    return "MetaMask";
  }

  async signMessage(msg) {
    return await this.signer.signMessage(msg);
  }

  async signTypedData(params) {
    return await this.signer._signTypedData(
      params.domain,
      params.types,
      params.value
    );
  }

  async getAddress() {
    return await this.signer.getAddress();
  }
}




const getProvider = async()=>{
  
   const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
   const signer = new MetaMaskSmartAccountSigner(walletProvider.getSigner());

   const factoryAddress = getDefaultLightAccountFactoryAddress(chain);

   console.log("signer : ",signer)
    
    const provider = new AlchemyProvider({
      apiKey: SwapData.ALCHEMY_APIKEY,
      chain,
    }).connect(
      (rpcClient) =>
        new LightSmartContractAccount({
          chain,
          owner: signer,
          factoryAddress,
          rpcClient,
        })
    );

      return provider;
      
    }

export default getProvider;