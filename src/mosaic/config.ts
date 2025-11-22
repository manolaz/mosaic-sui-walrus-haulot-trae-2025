import { useNetworkVariables } from "../networkConfig";
import type { SealKeyServer } from "./types";

export function useMosaicConfig() {
  const vars = useNetworkVariables() as Record<string, string>;
  const mosaicPackageId = vars["MOSAIC_PACKAGE_ID"] ?? "";
  const sealServers: SealKeyServer[] = [
    {
      objectId:
        "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
      url: "https://seal-key-server-testnet-1.mystenlabs.com",
    },
    {
      objectId:
        "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
      url: "https://seal-key-server-testnet-2.mystenlabs.com",
    },
  ];
  return { mosaicPackageId, sealServers };
}

export const MOSAIC_TAGLINE = "Every attendee is a piece of the picture.";