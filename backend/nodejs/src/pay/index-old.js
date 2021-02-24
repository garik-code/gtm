require('dotenv').config({path: '.env'})

const DataBase   = require('../lib/database')
const Memcached  = require('../lib/memcached')
const Partners   = require('../lib/partners')
const Pay        = require('./lib/core')

const db = new DataBase({
  user     : process.env.POSTGRES_DB_USER,
  host     : process.env.POSTGRES_DB_HOST,
  database : process.env.POSTGRES_DB_TABLE,
  password : process.env.POSTGRES_DB_PASS,
  port     : process.env.POSTGRES_DB_PORT,
})
const cache = new Memcached({
  server  : process.env.MEMCACHED_SERVER,
  update  : process.env.MEMCACHED_UPDATE,
  options : {}
})

const request = require('request')
const sgMail  = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// get transactions binance

Pay.fetchDeposits()
.then(
  fetchDeposits => {

    // see deposits

    for (let i = 0; i < fetchDeposits.length; i++) {

      // get paymenents amount and currency where amount and currency

      db.get('payments', { status: 1, amount: fetchDeposits[i].amount, currency: fetchDeposits[i].currency })
      .then(
        payments => {
          payments = payments.rows

          console.log(payments);

          // see payments

          for (let i = 0; i < payments.length; i++) {

            // get paymentsconfirm where pay_id and status 0

            db.get('paymentsconfirm', { pay_id: payments[i].id, status: 0 })
            .then(
              paymentsconfirm => {
                if (paymentsconfirm.rows[paymentsconfirm.rows.length - 1].info == fetchDeposits[i].txid) {

                  // pay convert get usdt transactions

                  Pay.convert({
                    amount: payments[i].amount,
                    currency: payments[i].currency
                  }).then(
                    usdt => {

                      console.log(`usdt: ${usdt} !!!`);

                      usdt = 400

                      let configPartners = Partners.config()
                      let packagesPrices = Object.values(configPartners.types)
                      let packagesNames = Object.keys(configPartners.types)

                      for (let p = 0; p < packagesPrices.length; p++) {
                        if (parseFloat(usdt) >= parseFloat(packagesPrices[p].price_min)) {

                          let time = Math.floor(new Date() / 1000)
                          time = time + 31536000
                          db.add('packages', { email: payments[i].email, type: packagesNames[p], time: time }).then(s => {}, e => {})

                          // update status payment
                          // db.update('payments', { status: 200 }, { id: payments[i].id }).then(s => console.log(s), e => console.log(e))

                          // sms notification user
                          // request.get(`https://sms.ru/sms/send?api_id=${process.env.SMS_RU}&to=${parseInt(req.body.phone)}&msg=Leonardo+${code}&json=1`)

                          // add value binary !?

                          break
                        }
                      }

                      Partners.fetchLines(payments[i].email)
                      .then(
                        fetchPartners => {
                          Partners.calculateRewardLines(fetchPartners, usdt, 'USDT')
                          .then(
                            calculateRewardLines => {

                              console.log(calculateRewardLines);

                              for (let x = 0; x < calculateRewardLines.length; x++) {

                                let email  = calculateRewardLines[x].email
                                let amount = calculateRewardLines[x].amount
                                let usdt   = calculateRewardLines[x].usdt
                                let invest = calculateRewardLines[x].invest
                                let line   = calculateRewardLines[x].line

                                // search package user and lines params

                                // db.add('transactions', { email: email, currency: 'USDT', amount: usdt, info: payments[i].email, type: 'package update' }).then(s => {}, e => {})
                                // db.add('transactions', { email: email, currency: 'LEO', amount: invest, info: payments[i].email, type: 'package update' }).then(s => {}, e => {})

                                // db.get('balances', { email: email, currency: 'USDT' })
                                // .then(
                                //   fetchBalance => {
                                //     if(fetchBalance.rows.length == 0){
                                //       db.add('balances', { email: email, currency: 'USDT', amount: usdt }).then(s => {}, e => {})
                                //     }else{
                                //       db.update('balances', { amount: parseFloat(fetchBalance.rows[0].amount) + parseFloat(usdt) }, { email: email, currency: 'USDT' })
                                //     }
                                //   },
                                //   err => {
                                //     db.add('balances', { email: email, currency: 'USDT', amount: usdt }).then(s => {}, e => {})
                                //   }
                                // )

                                // db.get('balances', { email: email, currency: 'LEO' })
                                // .then(
                                //   fetchBalance => {
                                //     if(fetchBalance.rows.length == 0){
                                //       db.add('balances', { email: email, currency: 'LEO', amount: invest }).then(s => {}, e => {})
                                //     }else{
                                //       db.update('balances', { amount: parseFloat(fetchBalance.rows[0].amount) + parseFloat(invest) }, { email: email, currency: 'LEO' })
                                //     }
                                //   },
                                //   err => {
                                //     db.add('balances', { email: email, currency: 'LEO', amount: invest }).then(s => {}, e => {})
                                //   }
                                // )

                                // sms notification managers
                                // request.get(`https://sms.ru/sms/send?api_id=${process.env.SMS_RU}&to=${parseInt(req.body.phone)}&msg=Leonardo+${code}&json=1`)

                                // email notification managers
                                // const msg = {
                                //   to: req.body.email,
                                //   from: 'welcome@leonardo.fund',
                                //   subject: 'Leonardo :: Email verification',
                                //   text: `Code: ${code}`,
                                //   html: `<strong>Code: ${code}</strong>`,
                                // }
                                // sgMail.send(msg)

                              }


                            },
                            err => console.log(err)
                          )
                        },
                        err => console.log(err)
                      )
                    },
                    err => console.log(err)
                  )
                }else{

                  console.log(payments[i].id)
                  console.log(payments[i].email)

                  // update status payment failed
                  // db.update('payments', { status: 500 }, { id: payments[i].id }).then(s => console.log(s), e => console.log(e))

                  // email notification

                }
              }
            )
          }
        },
        e => console.log(e)
      )
    }
  },
  e => console.log(e)
)
