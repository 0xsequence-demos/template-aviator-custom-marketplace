import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import {sequence} from '0xsequence'
import { Spinner, Button, Box, Card, Text, Modal,useTheme, TextInput, GradientAvatar } from '@0xsequence/design-system';
import {ethers} from 'ethers'
//@ts-ignore
import TickerBoard from './TickerBoard'
//@ts-ignore
import { Board } from 'ticker-board'
import SequenceMarketABI from './ISequenceMarket.json'
import { SequenceIndexer } from '@0xsequence/indexer'
import { AnimatePresence } from 'framer-motion'
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import DateTimePicker from 'react-datetime-picker';

import plane1 from './planes/Falcon_Mark_IV_Redtail.png'
import plane2 from './planes/Hawkwind_P-22_Emerald.png'
import plane3 from './planes/Lightning_Spectre_G6.png'
import plane4 from './planes/Raptor_Fury_X2.png'
import plane5 from './planes/Skyraider_Z-11_Onyx.png'
import plane6 from './planes/Thunderbolt_XR-5_Cobalt.png'

import { useOpenConnectModal } from '@0xsequence/kit'
import { useDisconnect, useAccount, useWalletClient, useConnect} from 'wagmi'
import { sendTransaction } from '@wagmi/core';
import { config } from "./config"

const planePanels = [plane1,plane2,plane3,plane4,plane5,plane6]

function BasicDateTimePicker(props: any) {
  const [value, onChange] = useState<any>(new Date());
  return (
    <DateTimePicker isCalendarOpen={false} 
    onChange={(value) => {
      console.log(value)
      const epochTime = Date.parse(value!.toString()); // Convert milliseconds to seconds
      props.setExpiry(epochTime)
      onChange(value)
  }} value={value} />
  );
}

const ColorPanels = (props: any) => {
  // for loading
  const colors = [
    'rgba(255, 0, 0, 0.65)', // red
    'rgba(255, 165, 0, 0.65)', // orange
    'rgba(173, 216, 230, 0.65)', // blue
    'rgba(0, 128, 0, 0.65)', // green
    'rgba(255, 255, 0, 0.65)', // yellow
    'rgba(0, 0, 255, 0.65)', // blue
    'rgba(75, 0, 130, 0.65)', // indigo
  ].reverse()

  const handlePanelClick = (id: any) => {
    props.setSelectedId(id); // Update the selected panel ID
  };

  useEffect(() => {
  }, [props.selectedId])
  return (
    <div className="panel-container">
      <div className="grid-container">
        {colors.slice(1).map((color, index) => (
          <div
            key={index}
            className={`color-panel ${props.selectedId === index + 1 ? 'selected' : ''} ${props.selectedId !== null && props.selectedId !== index + 1 ? 'greyed-out' : ''}`}
            style={{ backgroundImage: props.colored && props.colored.slice(1,props.colored.length)[index] > 0 ? `url(${planePanels[index]})` : '', backgroundColor: props.colored ?  props.colored.slice(1,props.colored.length-1)[index] > 0 ? color : 'grey' : color}}
            onClick={() => {
              if(props.market) {
                props.setRequestId(props.requests.slice(1,props.requests.length)[index])
                props.setPrice(props.prices.slice(1,props.prices.length)[index])
              }
              props.setPlane && props.setPlane(planePanels[index])
              if(props.colored&&props.colored.slice(1,props.colored.length)[index] > 0) handlePanelClick(index + 1)
              else if(!props.colored)  handlePanelClick(index + 1)
            }}
          >
            {props.market == true && props.colored &&props.colored.slice(1,props.colored.length)[index] > 0 && props.colored.slice(1,props.colored.length)[index]}
            <span style={{fontSize: '10px'}}>{props.names && props.names[index] && props.names[index][0]}</span></div>
        ))}
      </div>
    </div>
  );
};
  
let flipBoard: any = null
function App() {
  const {setTheme} = useTheme()

  setTheme('light')

  const [loggedIn, setLoggedIn] = useState(false)
  const [topOrders, setTopOrders] = useState([0,0,0,0,0,0,0])
  const [selectedId, setSelectedId] = useState(null); // Track the selected panel
  const [view, setView] = useState(0)
  const [isOpen, toggleModal] = useState(false)
  const [requestId, setRequestId] = useState(null)
  const [requests, setRequests] = useState([])
  const [prices, setPrices] = useState([])
  const { setOpenConnectModal } = useOpenConnectModal()
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient({chainId: 137})
  const { connectors } = useConnect()
  const [isSequence, setIsSequence] = useState<any>(false)
  const [isMinting, setIsMinting] = useState<any>(false)
  const [isViewOrderbook, setIsViewOrderbook] = useState(false)

  const metadata: any = [
    ["Falcon Mark IV Redtail", "A sleek, high-speed interceptor with a gleaming scarlet finish."],
    ["Hawkwind P-22 Emerald", "A nimble, versatile fighter with a striking, metallic emerald green coat."],
    ["Lightning Spectre G6", "A ghostly, agile aircraft with a unique, shimmering silver hue that seems to fade in and out of visibility."],
    ["Raptor Fury X2", "A fast and furious dogfighter with a fiery, vibrant orange livery, striking fear into the hearts of its adversaries."],
    ["Skyraider Z-11 Onyx", "A fearsome, all-black night fighter known for its stealth and power."],
    ["Thunderbolt XR-5 Cobalt", "A robust, heavy fighter painted in a deep, vivid cobalt blue."],
     ]

  sequence.initWallet("AQAAAAAAAAfalbPQnQhGI9F68UTWT9RyHlM",{defaultNetwork: 'polygon'})

  useEffect(() => {
    // new TickerBoard('.create-ticker')
    setTimeout(async ()=>{
      console.log(connectors.map(async (connector) => {
        if(await connector.isAuthorized()){
          if(connector.id == 'sequence'){
            setIsSequence(true)
          }
        }
      }))

      const res = await fetch('https://dev-marketplace-api.sequence.app/polygon/rpc/Marketplace/GetTopOrders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "collectionAddress": "0x1693ffc74edbb50d6138517fe5cd64fd1c917709",
            "currencyAddresses": ["0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"],
            "orderbookContractAddress": "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
            "tokenIDs": [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
            ],
            "isListing": true,
            "priceSort": "DESC"
        })
    });
    const result = await res.json()

    const object: any = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    }

    console.log(result)

    const requestList: any = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    }
    const prices: any = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    }
    console.log(result.orders)
    result.orders.map(async (order: any) => {
      console.log('in this loop')
      console.log(order)
      if(Number(order.pricePerToken) / 10**6 >= 0.01){

        object[order.tokenId] = Number(Number(order.pricePerToken) / 10**6).toFixed(2)
        // const res = await fetch(`https://metadata.sequence.app/tokens/${'polygon'}/${order.tokenContract}/${order.tokenId}`)
        // const json = await res.json()
        // console.log(json)
        // order.image = json[0].image
        // return order
        requestList[order.tokenId] = order.orderId
        prices[order.tokenId] = Number(order.pricePerToken).toFixed(2)
      }

    })
    setTopOrders(object)
    setRequests(Object.values(requestList))
    setPrices(Object.values(prices))
    }, 1000)
  }, [loggedIn, toggleModal, isViewOrderbook, view])

  useEffect(() => {
    if(isConnected) setLoggedIn(true)
    if(isConnected)console.log(walletClient)
    console.log(sequence.getWallet())
  }, [isConnected])
  const connect = async () => {
    disconnect()
    setOpenConnectModal(true)
    // const wallet = sequence.getWallet()
    // const details = await wallet.connect({app: 'sequence-market-feed'})

    // if(details.connected){
      // setLoggedIn(true)
    // }
  }

  const fillOrder = async () => {
    const sequenceMarketInterface = new ethers.utils.Interface(SequenceMarketABI.abi)
    const wallet = await sequence.getWallet()
    const signer = await wallet.getSigner(137)

    console.log(requestId)
    console.log(price)
    const data = sequenceMarketInterface.encodeFunctionData(
      'acceptRequest', [requestId, 1, await wallet.getAddress(), [],[]]
    )

    const erc20Interface = new ethers.utils.Interface(["function approve(address spender, uint256 amount) public returns (bool)"])

    const dataApprove = erc20Interface.encodeFunctionData(
      'approve', ["0xB537a160472183f2150d42EB1c3DD6684A55f74c",Number(price)]
    )

    const txApprove: any = {
      to: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      data: dataApprove
    }

    const tx = {
      to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
      data: data
    }

    try {

      if(isSequence){
        const wallet = sequence.getWallet()
        const signer = wallet.getSigner()
        const res = await signer.sendTransaction([txApprove, tx])
        console.log(res)
      }else {

      }
      // const res = await signer.sendTransaction([txApprove,tx])
      // console.log(res)
      setSelectedId(null)
    }catch(err){
    }
  }

  const mint = async () => {
    const wallet = sequence.getWallet()
    const signer = wallet.getSigner(137)
    // const erc1155Interface = new ethers.utils.Interface(["function mint(address to, uint256 tokenId, uint256 amount, bytes data) returns ()"])
    // console.log(selectedId)
    // const data = erc1155Interface.encodeFunctionData(
    //   'mint', [await wallet.getAddress(),selectedId,1,"0x00"]
    // )

    // const tx = {
    //   to: "0x1693ffc74edbb50d6138517fe5cd64fd1c917709",
    //   data: data
    // }
    // const url = 'https://yellow-bonus-97e1.yellow-shadow-d7ff.workers.dev';
    const url = 'https://yellow-bonus-97e1.yellow-shadow-d7ff.workers.dev';
    console.log(address)
const data = {
  address: address,
  tokenId: selectedId
};

async function postData() {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    console.log(response);
    setIsMinting(false)
    setSelectedId(null)
  } catch (error) {
    console.error('Error:', error);
    setIsMinting(false)
  }
}



    try {
      setIsMinting(true)
      postData();
    }catch(err){
      console.log(err)
    }
  }

  const createOrder = async () => {
    const erc1155Interface = new ethers.utils.Interface(["function setApprovalForAll(address operator, bool approved) external"])
    const sequenceMarketInterface = new ethers.utils.Interface(SequenceMarketABI.abi)
    console.log(price)
    console.log('testing')
    if(isSequence){
      const wallet = sequence.getWallet()
      const signer = wallet.getSigner(137)

      const request = {
          creator: await wallet.getAddress(),
          isListing: true,
          isERC1155: true,
          tokenContract: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
          tokenId: selectedId,
          quantity: quantity,
          expiry: expiry,
          currency: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
          pricePerToken: Math.floor(Number(price)*10**6)
      }

      const data = sequenceMarketInterface.encodeFunctionData(
        'createRequest', [request]
      )

      const dataApprove = erc1155Interface.encodeFunctionData(
        'setApprovalForAll', ["0xB537a160472183f2150d42EB1c3DD6684A55f74c",true]
      )

      const tx = {
        to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
        data: data
      }

      const txApprove = {
        to: "0x1693ffc74edbb50d6138517fe5cd64fd1c917709",
        data: dataApprove
      }

      try {
        const res = await signer.sendTransaction([txApprove,tx])
        toggleModal(false)
        setSelectedId(null)
        setView(2)
      }catch(err){
        console.log(err)
      }
    } else {

      const request = {
        creator: walletAddress,
        isListing: true,
        isERC1155: true,
        tokenContract: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
        tokenId: selectedId,
        quantity: quantity,
        expiry: expiry,
        currency: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        pricePerToken: price
      }

      const data = sequenceMarketInterface.encodeFunctionData(
        'createRequest', [request]
      )

      const dataApprove = erc1155Interface.encodeFunctionData(
        'setApprovalForAll', ["0xB537a160472183f2150d42EB1c3DD6684A55f74c",true]
      )

      const res1 = await sendTransaction(config, {
        to: "0x1693ffc74edbb50d6138517fe5cd64fd1c917709",
        data: dataApprove as `0x${string}`
      })

      const res2 = await sendTransaction(config, {
        to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
        data: data as `0x${string}`
      })
      setSelectedId(null)
      setView(2)
      toggleModal(false)
    }
  }

  const aircraftNames = ['AVIATOR', "HANGAR"];
  const [balance, setBalance] = useState({})
  const [quantity, setQuantity] = useState(null)
  const [price, setPrice] = useState<number>(0)
  const [expiry, setExpiry] = useState(null)
  const [walletAddress,setWalletAddress] = useState<any>(null)
  const [plane,setPlane] = useState<any>(null)
  const {disconnect} = useDisconnect()

  useEffect(() => {

    setTimeout(async () => {
      if(loggedIn){

      const indexer = new SequenceIndexer('https://polygon-indexer.sequence.app', 'c3bgcU3LkFR9Bp9jFssLenPAAAAAAAAAA')

      const accountAddress = address
      
      const tokenBalances = await indexer.getTokenBalances({
        accountAddress: accountAddress,
        contractAddress: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
        includeMetadata: true
      })

      const object: any = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
      }

      tokenBalances.balances.map((token) => {
        object[token.tokenID] = 1
      })

      setBalance(object)
    }

    }, 0)
  }, [view])

  const [orderbookListings, setOrderbookListings] = useState([])

  const viewOrderbook = async (fromTab = false) => {
    if(fromTab) setIsViewOrderbook(false)
    else setIsViewOrderbook(!isViewOrderbook)
  }

  useEffect(() => {
    setTimeout(async () => {
      if(isViewOrderbook){
        const res = await fetch('https://dev-marketplace-api.sequence.app/polygon/rpc/Marketplace/GetOrderbookOrders', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              "collectionAddress": "0x1693ffc74edbb50d6138517fe5cd64fd1c917709",
              "currencyAddresses": ["0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"],
              "orderbookContractAddress": "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
              "tokenIDs": [selectedId
              ],
              "isListing": true,
              "priceSort": "DESC"
          })
      });
      const result = await res.json()

      const listings: any = []
      result.orders.map((order: any) => {
        if(order.tokenId == selectedId){
          listings.push(order)
        }
      })

      setOrderbookListings(listings)
      }
    }, 0)
  }, [isViewOrderbook])

  const [cardId, setCardId] = useState(null)

  const handleCardId = async (id: any) => {
    console.log(id)
    if(id == cardId) setCardId(null)
    else setCardId(id)
  }

  const fillOrderSpecific = async () => {
    const sequenceMarketInterface = new ethers.utils.Interface(SequenceMarketABI.abi)

    try {
    if(isSequence){

      const data = sequenceMarketInterface.encodeFunctionData(
        'acceptRequest', [requestId, 1, address, [],[]]
      )
  
      const erc20Interface = new ethers.utils.Interface(["function approve(address spender, uint256 amount) public returns (bool)"])
  
      const dataApprove = erc20Interface.encodeFunctionData(
        'approve', ["0xB537a160472183f2150d42EB1c3DD6684A55f74c",Number(price)]
      )

      const txApprove = {
        to: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        data: dataApprove
      }

      const tx = {
        to: '0xB537a160472183f2150d42EB1c3DD6684A55f74c',
        data: data
      }

      const wallet = sequence.getWallet()
      const signer = wallet.getSigner()

      const res = await signer.sendTransaction([txApprove, tx])
      setView(2)
      setIsViewOrderbook(false)
    }else {
// const wallet = await sequence.getWallet()
    // const signer = await wallet.getSigner(137)
      const data = sequenceMarketInterface.encodeFunctionData(
        'acceptRequest', [requestId, 1, address, [],[]]
      )

      const erc20Interface = new ethers.utils.Interface(["function approve(address spender, uint256 amount) public returns (bool)"])

      const dataApprove = erc20Interface.encodeFunctionData(
        'approve', ["0xB537a160472183f2150d42EB1c3DD6684A55f74c",Number(price)]
      )

      try {
        const res1 = await sendTransaction(config, {
          to: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
          data: dataApprove as `0x${string}`
        })

        const res2 = await sendTransaction(config, {
          to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c",
          data: data as `0x${string}`
        })
        setView(2)
        setIsViewOrderbook(false)
      }
      catch(err) {
        console.log(err)
      }
    }

    }  catch(err) {
        console.log(err)
    }
  }


  const [coinTickerBoard, setCoinTickerBoard] = useState<any>(null)
  async function generateNumber() {
    // List of Ethereum network URLs
    const networkUrls = [
      'https://nodes.sequence.app/mainnet/AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo',
      'https://nodes.sequence.app/base/AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo',
      'https://nodes.sequence.app/avalanche/AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo',
      'https://nodes.sequence.app/arbitrum-nova/AQAAAAAAAAgNjIRFEAG0m21hy3oLEEKQLpo'
    ];
      // Array to store each digit's value
      const digits = [];
    
      for (const url of networkUrls) {
        // Make an ethers call to the current network URL to get the block number
        const provider = new ethers.providers.JsonRpcProvider(url);
        const blockNumber = await provider.getBlockNumber();
    
        // Calculate TTL and mod 9 for each digit separately
        const ttl = Math.floor(blockNumber / 9);
        const digitValue = ttl % 9;
    
        // Push the digit value to the array
        digits.push(digitValue);
      }
    
      // Merge the digit values to generate the final number
      const generatedNumber = digits.reduce((result, digit) => result * 10 + digit, 0);
    
      // Ensure the final number is between 0 and 9999
      const finalNumber = generatedNumber % 10000;
    
      return finalNumber;
    }

  const request = async () => {
    const number = Number(await generateNumber())
    setIsMinting(true)

    try {
      // const url = 'https://yellow-bonus-97e1.yellow-shadow-d7ff.workers.dev';
      const url = 'http://localhost:8787';
      console.log(address)
      const data = {
        address: address,
        amount: number
      };

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          console.log(response);
          setIsMinting(false)
          setCoinTickerBoard(<TickerBoard
            messages={['꩜'+String(number)]}
            count={1}
            size={5}
            theme={'dark'}
          />)
        } catch (error) {
          console.error('Error:', error);
          setIsMinting(false)
          setCoinTickerBoard(<TickerBoard
            messages={['꩜'+'Error']}
            count={1}
            size={5}
            theme={'dark'}
          />)
        }

  }catch(err){
    console.log(err)
  }
}

  useEffect(() => {

  }, [cardId, coinTickerBoard])
  return (
    <div className="App">
      {
        loggedIn ? 
          <>
          <br/>
          {isConnected && <div style={{position: 'fixed', top: '20px', right: '30px'}}>
            <span onClick={() => {setLoggedIn(false);disconnect()}} style={{cursor: 'pointer', fontFamily: 'circular', color: 'black', paddingBottom: '5px', display: 'inline-block'}}>sign out</span>
          </div>}
          {/* <span onClick={() => {setView(-1);setSelectedId(null);}} style={{cursor: 'pointer', fontFamily: 'circular', color: 'black', paddingBottom: '5px', borderBottom: `${view == -1 ? '1' : '0'}px solid black`, display: 'inline-block'}}>faucet</span> */}
          &nbsp;&nbsp;&nbsp;&nbsp;<span onClick={() => {setView(0);setSelectedId(null);}} style={{cursor: 'pointer', fontFamily: 'circular', color: 'black', paddingBottom: '5px', borderBottom: `${view == 0 ? '1' : '0'}px solid black`, display: 'inline-block'}}>mint</span>
          &nbsp;&nbsp;&nbsp;&nbsp;<span onClick={() => {setView(1);setSelectedId(null);viewOrderbook(true);}} style={{fontFamily: 'circular', cursor: 'pointer', color: 'black', paddingBottom: '5px', borderBottom: `${view == 1 ? '1' : '0'}px solid black`, display: 'inline-block'}}>market</span>
          &nbsp;&nbsp;&nbsp;&nbsp;<span onClick={() => {setView(2);setSelectedId(null);}} style={{fontFamily: 'circular', cursor: 'pointer', color: 'black', paddingBottom: '5px', borderBottom: `${view == 2 ? '1' : '0'}px solid black`, display: 'inline-block'}}>sell</span>
          {
              view == 0 
            ?
              <>
            <div className="parent">
              <TickerBoard
                messages={['MINT']}
                count={1}
                size={6}
                theme={'dark'}
              />
            </div>
                <p style={{color: 'black', fontFamily: 'circular'}}>✈️ choose your plane color</p>
                <Box justifyContent={'center'}>
                  <ColorPanels names={metadata} colored={[1,1,1,1,1,1,1,1]}setSelectedId={setSelectedId} selectedId={selectedId}/>
                </Box> 
                <p style={{fontFamily: 'circular'}}>{selectedId && metadata[selectedId!-1][1]}</p>
                <br/>
                {!isMinting ? <Box justifyContent={'center'}>
                  <Button disabled={selectedId == null} padding={"4"} label="mint" onClick={() => mint()}></Button>
                </Box> :  <Box justifyContent={'center'}><Spinner/></Box>}
              </>
            :
              view == 1 
            ? 
              <>
              <div className="parent">
              <TickerBoard
                  messages={['MARKET']}
                  count={1}
                  size={6}
                  theme={'dark'}
                />
              </div>
              {
                !isViewOrderbook ? 
                <p style={{color: 'black', fontFamily: 'circular'}}>✈️ request the top order</p>
                :
                <p style={{color: 'black', fontFamily: 'circular'}}>✈️ find a specific order</p>
              }

                {!isViewOrderbook ? <Box justifyContent={'center'}>
                  <ColorPanels setPlane={setPlane} setPrice={setPrice} prices={prices} requests={requests} setRequestId={setRequestId} market={true} colored={Object.values(topOrders)} setSelectedId={setSelectedId} selectedId={selectedId}/>
                </Box> : <>
                <Box>
                  <div className='parent'>
                    <br/>
                    <div className='color-panel selected' style={{backgroundImage: `url(${plane})`}} />
                    <br/>
                  <div style={{width: '740px'}}>
                    {orderbookListings.map((order: any, index: any) => {
                      return <Card
                      style={{
                        cursor: 'pointer',
                        border: cardId === index ? '1px solid lightblue' : '',
                        display: 'flex',            // Set display to flex
                        alignItems: 'center',       // Center items horizontally
                        justifyContent: 'center',   // Center items vertically
                      }}
                      onClick={() => {
                        setRequestId(order.orderId);
                        setPrice(order.pricePerToken);
                        setPlane(planePanels[selectedId!-1]);
                        setWalletAddress(order.creatorAddress);
                        handleCardId(index);
                      }}
                    >
                      <span><GradientAvatar address={order.createdBy} /></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <span> {order.createdBy}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <span>orderId: {order.orderId}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <span>tokenId: {order.tokenId}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      <span>${Number(order.pricePerToken) / 10**6}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Card>
                    
                    })}
                  </div>
                  </div>
                </Box>
                </> }
                <br/>
                <br/>
                <br/>
                <div style={{position: 'fixed', bottom: '30px', left: '41vw'}}>
                <Box justifyContent={'center'}>
                {!isViewOrderbook ?  <Button disabled={selectedId == null} padding={"4"} label="fulfill order" onClick={() => fillOrder()}></Button> :  <Button disabled={cardId == null} padding={"4"} label="fulfill order" onClick={() => fillOrderSpecific()}></Button> }
                  {!isViewOrderbook ? <Button disabled={selectedId == null} padding={"4"} label="view orderbook" onClick={() => viewOrderbook()}></Button> : <Button disabled={selectedId == null} padding={"4"} label="back" onClick={() => viewOrderbook()}></Button> }
                </Box>  
                </div>
              </>
            :
              view == 2 
              ? 
              <>
                <div className="parent">
                <TickerBoard
                    messages={['SELL']}
                    count={1}
                    size={6}
                    theme={'dark'}
                  />
                </div>
                <p style={{color: 'black', fontFamily: 'circular'}}>✈️ sell your plane</p>
                <Box justifyContent={'center'}>
                  <ColorPanels colored={Object.values(balance)} setSelectedId={setSelectedId} selectedId={selectedId}/>
                </Box> 
                <Box justifyContent={'center'}>
                  <Button disabled={selectedId == null} padding={"4"} label="create order" onClick={() => toggleModal(true)}></Button>
                </Box>  
              </>
              :
              <>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>
              <br/>

                <div className="parent">
                <TickerBoard
                    messages={['FAUCET']}
                    count={1}
                    size={6}
                    theme={'dark'}
                  />
                  {coinTickerBoard}
                </div>
                <br/>
                <br/>
                <br/>
                <Box justifyContent={"center"}>
                  {!isMinting ? <Button label="request" onClick={() => request()}/> : <Spinner/>}
                </Box>
              </>
            } 
            <br/>
          </>
        :
        <>
          <br/>
          <br/>
          <div className="parent">
          <TickerBoard
              messages={['AVIATOR', "HANGAR"]}
              count={2}
              size={7}
              theme={'dark'}
            />
          </div>
          <br/>
          <Box>
            <Button variant="primary" padding={"4"} label="connect" onClick={() => connect()}></Button>
          </Box>
          
          <br/>
          <br/>
        </>
      }
        <AnimatePresence>
        {

          isOpen 
            && 
            <Modal  onClose={() => toggleModal(false)}>

                <Box
                  flexDirection="column"
                  justifyContent="space-between"
                  height="full"
                  padding="16"
                >
                    <Box marginTop="5" marginBottom="4">
                      <br/>
                      <Text variant="normal" color="text80">
                        Enter your listing in USDC
                      </Text> 
                      <br/>
                      <br/>
                      <BasicDateTimePicker setExpiry={setExpiry}/>
                      <br/>
                      <br/>
                      <TextInput  name="" placeholder="quantity" onChange={(value: any) => setQuantity(value.target.value)}/>
                      <br/>
                      <TextInput  name="" placeholder="price" onChange={(value: any) => setPrice(Number(value.target.value))}/>
                      <br/>
                      <Box justifyContent={'center'}>
                        <Button disabled={selectedId == null} padding={"4"} label="submit" onClick={() => createOrder()}></Button>
                      </Box>  
                    </Box>
                </Box>
            </Modal>
        }
        </AnimatePresence>
    </div>
  );
}

export default App;