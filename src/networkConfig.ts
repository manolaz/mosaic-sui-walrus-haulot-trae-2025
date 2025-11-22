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
      MOSAIC_PACKAGE_ID: "0xae764475e3f1805a5a989530cbd72af5b24a6ca0148e49a99e3fbcaa0f4ca64d",
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
