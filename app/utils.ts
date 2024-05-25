export function replaceIpfsUrl(ipfsUrl: string): string {
    return ipfsUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
}

export function getGemsUrl(collection: string, nft: string): string {
    return `https://testnet.getgems.io/collection/${collection}/${nft}`;
}