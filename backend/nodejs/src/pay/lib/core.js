require('dotenv').config({path: '.env'})
const ccxt = require('ccxt')

let public = new ccxt[process.env.EXCHANGE] ({
  'timeout': 30000,
  'enableRateLimit': true
})

let private = new ccxt[process.env.EXCHANGE] ({
  'timeout': 30000,
  'enableRateLimit': true,
  'apiKey': process.env.KEY,
  'secret': process.env.SECRET
})

Object.prototype.calc = function (dollars) {
  let sum = 0
  for (let i = 0; i < this.length; i++) {
    sum = parseFloat(sum) + (parseFloat(this[i][0])*parseFloat(this[i][1]))
    if(parseFloat(dollars) <= sum) {
      return (parseFloat(dollars)/parseFloat(this[i][0])).toFixed(8)
    }
  }
}

Object.prototype.filterOne = function (type) {
  let res = []
  for (var i = 0; i <= this.length; i++) {
    if (i == this.length) {
      return res
    }else{
      if (res.indexOf(this[i][type]) < 0) {
        res.push(this[i][type])
      }
    }
  }
}

Object.prototype.notNull = function () {
  let res = []
  let keys = Object.keys(this)
  let values = Object.values(this)
  for (var i = 0; i <= values.length; i++) {
    if (i == values.length) {
      return res
    }else{
      if (values[i] != 0) {
        res.push({
          key: keys[i],
          value: values[i]
        })
      }
    }
  }
}

Object.prototype.getPrice = function (amount) {
  let amountCalc = 0
  for (let i = 0; i < this.length; i++) {
    amountCalc = parseFloat(amountCalc) + parseFloat(this[i][1])
    if (amountCalc > amount) {
      return this[i][0]
    }
  }
}

exports.calculate = (market, dollars) => {
  return new Promise(function(resolve, reject) {
    public.fetchOrderBook(`${market}/USDT`)
    .then(
      fetchOrderBook => {
        resolve(fetchOrderBook.bids.calc(dollars))
      },
      e => reject(e)
    )
  })
}

exports.fetchCoins = () => {
  return new Promise((resolve, reject) => {
    resolve(['BTC', 'ETH', 'XRP'])
    // private.fetchMarkets()
    // .then(
    //   s => resolve(['BTC', 'ETH', 'XRP']),
    //   e => reject(e)
    // )
  })
}

exports.fetchCoinsWithdraw = () => {
  return new Promise((resolve, reject) => {
    resolve(['USDT (ERC20)'])
    // private.fetchMarkets()
    // .then(
    //   s => resolve(['USDT (ERC20)']),
    //   e => reject(e)
    // )
  })
}

exports.fetchDepositAddress = (market) => {
  return new Promise((resolve, reject) => {
    private.fetchDepositAddress(market)
    .then(
      s => resolve(s),
      e => reject(e)
    )
  })
}

exports.fetchDeposits = () => {
  return new Promise((resolve, reject) => {
    private.fetchDeposits()
    .then(
      s => resolve(s),
      e => reject(e)
    )
  })
}

exports.convert = (data) => {
  return new Promise((resolve, reject) => {
    let amount = data.amount
    let currency = data.currency
    private.fetchOrderBook(`${currency}/USDT`)
    .then(
      fetchOrderBook => {
        let price = fetchOrderBook.bids.getPrice(amount)
        private.createOrder (`${currency}/USDT`, 'limit', 'sell', amount, price)
        .then(
          sell => {
            resolve(price * amount)
          },
          err => console.log(err)
        )
      },
      err => console.log(err)
    )
  })
}
