'use client'
import {TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {
    Address,
    beginCell,
    toNano,
    TonClient4
} from "@ton/ton";
import {SendTransactionRequest} from "@tonconnect/sdk";
import {useEffect, useState} from "react";
import {NftCollection} from "@/app/sample_NftCollection";
import {NftItem} from "@/app/sample_NftItem";
import axios from "axios";
import {getGemsUrl, replaceIpfsUrl} from "@/app/utils";
import {Button, Card, Space} from "antd";
import {Layout, theme} from 'antd';
import Logo from '../assets/logo.webp';
import {LoadingOutlined} from "@ant-design/icons";

const {Header, Content, Footer, Sider} = Layout;
let collectionAddr = Address.parse("EQD0O56jpy8poTfBY-TrY_0mMG8pihRKeeekF7dDNKHB7UFB");
let packed = beginCell().storeUint(0, 32).storeStringTail("Mint").endCell();
const transaction: SendTransactionRequest = {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
        {
            address: collectionAddr.toString(),
            amount: toNano("0.1").toString(),
            payload: packed.toBoc().toString("base64") // payload with comment in body
        },
    ],
}
const {Meta} = Card;

export type Metadata = {
    name: string;
    description: string;
    image: string;
    attributes: {
        trait_type: string;
        value: string;
    }[];
}
export type NFT = {
    owner: Address;
    addr: Address;
} & Metadata;
export type CollectionMetadata = Omit<Metadata, "attributes">;
const client = new TonClient4({
    // endpoint: "https://mainnet-v4.tonhubapi.com", // 🔴 Main-net API endpoint
    endpoint: "https://sandbox-v4.tonhubapi.com", // 🔴 Test-net API endpoint
});
export default function Home() {
    const [totalNfts, setTotalNfts] = useState<bigint | undefined>();
    const [collectionMetadata, setCollectionMetadata] = useState<CollectionMetadata | undefined>();
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [tonConnectUI, setOptions] = useTonConnectUI();
    const [loading, setLoading] = useState(false);
    const connected = tonConnectUI?.connected;
    useEffect(() => {
        (async () => {
            const nftCollection = client.open(NftCollection.fromAddress(collectionAddr));
            const cData = await nftCollection.getGetCollectionData();
            const collectionMetadataUrl = cData.collection_content.asSlice().loadStringTail();
            const collectionMetadata = await axios.get<CollectionMetadata>(collectionMetadataUrl).then(res => res.data);
            setCollectionMetadata(collectionMetadata);
            console.log("cData", collectionMetadata);
            console.log("total nfts", cData.next_item_index - 1n);
            setTotalNfts(cData.next_item_index - 1n);
        })()
    }, []);
    useEffect(() => {
        (async () => {
            if (!totalNfts || !connected) {
                setNfts([]);
                setLoading(false);
                return;
            }
            let nfts: NFT[] = [];
            setLoading(true);
            for (let i = 0n; i < totalNfts; i++) {
                const nftCollection = client.open(NftCollection.fromAddress(collectionAddr));
                let nftAddr = await nftCollection.getGetNftAddressByIndex(i);
                if (nftAddr) {
                    const nft = client.open(NftItem.fromAddress(nftAddr));
                    const nftData = await nft.getGetNftData();
                    // const data = loadGetNftData(nftData.toSlice());
                    const individualContent = nftData.individual_content;
                    const metadataUrl = individualContent.asSlice().loadStringTail();
                    console.log("metadataUrl", metadataUrl);
                    // const individualContentString = individualContentSlice.loadStringTail();
                    const res = await axios.get<Metadata>(metadataUrl).then(res => res.data);
                    const metadata = {...res, image: replaceIpfsUrl(res.image), owner: nftData.owner_address, addr: nftAddr};
                    nfts.push(metadata);
                }
            }
            setLoading(false);
            setNfts(nfts);
        })()
    }, [totalNfts, connected]);
    const userFriendlyAddress = useTonAddress();
    const wallet = useTonWallet();
    const {
        token: {colorBgContainer, borderRadiusLG},
    } = theme.useToken();
    return (
        <Layout>
            <Header style={{
                display: 'flex',
                alignContent: 'center',
                justifyContent: 'space-between',
                background: 'white',
                padding: 0
            }}>
                <div style={{width: '200px'}}>
                    <img src={Logo.src} alt="logo" style={{width: '50px', marginTop: 'auto', marginBottom: 'auto'}}/>
                </div>
                <div>
                    <p style={{fontSize: 30}}>Photon AI Membership Card</p>
                </div>
                <TonConnectButton style={{
                    marginTop: 'auto',
                    marginBottom: 'auto',
                    width: '180px',
                    marginRight: '0',
                    textAlign: 'center'
                }}/>
            </Header>
            <Content
                style={{
                    padding: 24,
                    minHeight: '80vh',
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                }}
            >
                <div style={{marginTop: '200px', textAlign: 'center'}}>
                    <div style={{marginBottom: '20px'}}>
                        <p style={{fontSize: '28px'}}>
                            Your NFTs:
                        </p>
                    </div>
                    <div style={{display: 'flex', alignContent: 'center', justifyContent: 'center', gap: '20px 20px'}}>
                        {
                            loading && <LoadingOutlined style={{fontSize: 'large'}}/>
                        }
                        {
                            userFriendlyAddress && nfts.filter(nft => nft.owner.equals(Address.parse(userFriendlyAddress))).map((nft, i) => (
                                <Card
                                    key={i}
                                    title={nft.name}
                                    hoverable
                                    style={{width: 340}}
                                    cover={<a href={getGemsUrl(collectionAddr.toString(), nft.addr.toString())} target={'_blank'}><img alt="example" src={nft.image}/></a>}
                                >
                                    {/*<Meta title={nft.name} />*/}
                                </Card>
                            ))
                        }
                    </div>
                    <div style={{marginTop: '50px'}}>
                        {
                            tonConnectUI?.connected ?
                                (
                                    <Button type="primary" onClick={() => tonConnectUI && tonConnectUI.sendTransaction(transaction)}>
                                        Mint Membership Card
                                    </Button>
                                ) : (
                                    <Button type="primary" onClick={() => tonConnectUI?.modal && tonConnectUI.modal.open()} size={'large'}>
                                        Connect Wallet
                                    </Button>
                                )

                        }
                    </div>
                </div>
            </Content>

        </Layout>
    );
}
