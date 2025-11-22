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
      MOSAIC_PACKAGE_ID: "",
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
