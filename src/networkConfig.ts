import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl("devnet"),
    variables: {
      MOSAIC_PACKAGE_ID: "",
    },
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    variables: {
      MOSAIC_PACKAGE_ID: "0x20a68afb1ac21c1dd229b33d2f8fafc23f15e2c0bc7e2d7b07b6110a0bed4080",
    },
  },
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    variables: {
      MOSAIC_PACKAGE_ID: "",
    },
  },
});

export { useNetworkVariable, useNetworkVariables, networkConfig };
