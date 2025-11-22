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
      MOSAIC_PACKAGE_ID: "0x4a36d9b8463e10c943263c2ac5a01d1a1ef6a1a7792f63d122e7f082b72e5dfe",
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
