import axios from 'axios';
import { tokenList, WETH, QSWAP } from '../constant/constant';
import Config from '../util/config';
import unknownToken from "../assets/img/tokenquestion.png";
import { multicall } from '@wagmi/core'
import wagmiConfig from '../util/wagmiconfig';
import curveABI from './abi/curve.json';
import { CurveAddress } from '../constant/constant';


const FetchTokenList = async () => {

  const query = `
    query MyQuery {
        tokens {
            id
            name
            symbol
            decimals
        }
    }
  `;

  const response = await axios.post(Config.Subgraph_URL, {
    query: query
  })

  let tokenlist = [];

  let contracts = []

  contracts.push({
    address: CurveAddress,
    abi: curveABI,
    functionName: "allTokensLength",
    args: []
  })

  const _lengthRaw = await multicall(wagmiConfig, { contracts })
  const _length = _lengthRaw[0].status === "success" ? parseInt(_lengthRaw[0].result) : 0
  contracts = []

  for (let i = 0; i < _length; i++) {
    contracts.push({
      address: CurveAddress,
      abi: curveABI,
      functionName: "allTokens",
      args: [i]
    })
  }

  const _allTokensRaw = await multicall(wagmiConfig, { contracts })
  contracts = []
  for (let i = 0; i < _length; i++) {
    contracts.push({
      address: CurveAddress,
      abi: curveABI,
      functionName: "curveInfo",
      args: [_allTokensRaw[i].status === 'success' ? _allTokensRaw[i].result : CurveAddress]
    })
  }
  const _allCurvesRaw = await multicall(wagmiConfig, { contracts })
  const _allCurves = []
  for (let i = 0; i < _length; i++) {
    const token = _allTokensRaw[i].status === 'success' ? _allTokensRaw[i].result : ''
    const logo = _allCurvesRaw[i].status === "success" ? _allCurvesRaw[i].result[11] : ''
    const curveItem = { token, logo }

    _allCurves.push(curveItem)
  }
  console.log('allCurves', _allCurves)

  response.data.data.tokens.forEach(element => {
    const address = element.id;
    const symbol = element.symbol;
    const decimals = element.decimals;
    const name = element.name;
    let tokenImg;
    let display = false;


    tokenImg = unknownToken
    for (let token in tokenList) {
      if (element.id.toLowerCase() == tokenList[token].address.toLowerCase()) {
        tokenImg = tokenList[token].img;
        display = true;
        break;
      }
    }

    if (symbol == "QPEPE" || symbol == "JOULIE") {
      display = true;
    }

    console.log('Allcurves', _allCurves)
    _allCurves.forEach(curve => {

      if (curve.token.toLowerCase() === element.id.toLowerCase()) {
        console.log('allcurves', curve.token.toLowerCase(), 'quaiswap', element.id.toLowerCase(), 'logo', `${Config.pumpLogoURL}${curve.logo}`)
        if (curve.logo) {
          tokenImg = `${Config.pumpLogoURL}${curve.logo}`;
          display = true;
        } else {
          tokenImg = unknownToken;
        }
        return;
      }
    })

    tokenlist.push(
      {
        address: address,
        symbol: symbol,
        decimals: Number(decimals),
        name: name,
        img: tokenImg,
        display: display,
      }
    );
  });
  console.log("getApolloData ", tokenlist)

  return tokenlist
}

export { FetchTokenList };
