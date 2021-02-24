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

setInterval(() => {
  Pay.fetchDeposits()
  .then(
    fetchDeposits => {
      db.get('payments', { status: 1 })
      .then(
        payments => {
          db.get('paymentsconfirm', { status: 0 })
          .then(
            txid => {
              for (let i = 0; i < fetchDeposits.length; i++) {
                for (let x = 0; x < txid.rows.length; x++) {
                  if (fetchDeposits[i].txid == txid.rows[x].info) {
                    for (let e = 0; e < payments.rows.length; e++) {
                      if (txid.rows[x].pay_id == payments.rows[e].id) {

                        // Проверка email пользователя в момент выставления счета и его подтверждения

                        if(txid.rows[x].email == payments.rows[e].email){
                          if (fetchDeposits[i].status == 'ok') {

                            // Проверка существует ли уже такой айди транзакции

                            db.get('txids', { txid: fetchDeposits[i].txid })
                            .then(
                              searchTxid => {
                                if (searchTxid.rowCount > 0) {
                                  db.delete('paymentsconfirm', { pay_id: payments.rows[e].id })
                                  console.log('test del 1')
                                }else{

                                  if (parseFloat(fetchDeposits[i].amount) == parseFloat(payments.rows[e].amount)) {
                                    if (payments.rows[e].currency == fetchDeposits[i].currency) {

                                      Pay.convert({
                                        amount: fetchDeposits[i].amount,
                                        currency: fetchDeposits[i].currency
                                      })
                                      .then(
                                        usdt => {

                                          let configPartners = Partners.config()

                                          let config_keys_packages = Object.keys(configPartners.packages)
                                          let config_vals_packages = Object.values(configPartners.packages)

                                          for (var i = 0; i < config_vals_packages.length; i++) {
                                            if (config_vals_packages[i].price_max > usdt && config_vals_packages[i].price_min < usdt) {

                                              console.log('success package '+ config_keys_packages[i])

                                              // BUY PACKAGE

                                              let time = Math.floor(new Date() / 1000)
                                              time = time + 31536000
                                              db.add('packages', { email: payments.rows[e].email, type: config_keys_packages[i], unix: time }).then(s => {}, e => {})

                                              db.get('users', {
                                                email: payments.rows[e].email
                                              }).then(
                                                fetchUser => {
                                                  db.delete('partners_binary', { mail: fetchUser.rows[0].email, status: '2' })
                                                  db.add('partners_binary', {
                                                    name: fetchUser.rows[0].name,
                                                    user_id: fetchUser.rows[0].id,
                                                    mail: fetchUser.rows[0].email,
                                                    contact: fetchUser.rows[0].phone,
                                                    status: "0",
                                                    avatar: fetchUser.rows[0].avatar,
                                                    email: fetchUser.rows[0].partner
                                                  })
                                                  .then(
                                                    s => console.log(s),
                                                    e => console.log(e)
                                                  )
                                                },
                                                err => {
                                                  console.log(err)
                                                }
                                              )

                                              // bonus lines partners

                                              Partners.bonusLinesPackages(payments.rows[e].name, config_keys_packages[i], payments.rows[e].email, config_keys_packages[i].price_max)
                                              .then(
                                                success => console.log(success),
                                                err     => console.log(err)
                                              )

                                              // email notification

                                              // const msg = {
                                              //   to: payments.rows[e].email,
                                              //   from: 'payments@leonardo.fund',
                                              //   subject: 'Leonardo :: Update package',
                                              //   text: `Your package: ${config_keys_packages[i]}`,
                                              //   html: `Your package: ${config_keys_packages[i]}`,
                                              // }
                                              // sgMail.send(msg)

                                            }
                                          }

                                          let config_keys_access = Object.keys(configPartners.access)
                                          let config_vals_access = Object.values(configPartners.access)

                                          for (var i = 0; i < config_vals_access.length; i++) {
                                            if (config_vals_access[i].price_max > usdt && config_vals_access[i].price_min < usdt) {

                                              console.log('success access '+ config_keys_access[i])

                                              // BUY ACCESS

                                              let time = Math.floor(new Date() / 1000)
                                              time = time + 31536000
                                              db.add('packages', { email: payments.rows[e].email, type: config_keys_access[i], unix: time }).then(s => {}, e => {})

                                              db.get('users', {
                                                email: payments.rows[e].email
                                              }).then(
                                                fetchUser => {
                                                  db.delete('partners_binary', { mail: fetchUser.rows[0].email, status: '2' })
                                                  db.add('partners_binary', {
                                                    name: fetchUser.rows[0].name,
                                                    user_id: fetchUser.rows[0].id,
                                                    mail: fetchUser.rows[0].email,
                                                    contact: fetchUser.rows[0].phone,
                                                    status: "0",
                                                    avatar: fetchUser.rows[0].avatar,
                                                    email: fetchUser.rows[0].partner
                                                  })
                                                  .then(
                                                    s => console.log(s),
                                                    e => console.log(e)
                                                  )
                                                },
                                                err => {
                                                  console.log(err)
                                                }
                                              )

                                              // bonus lines partners

                                              Partners.bonusLinesAccess(payments.rows[e].name, config_keys_access[i], payments.rows[e].email, config_vals_access[i].price_max)
                                              .then(
                                                success => console.log(success),
                                                err     => console.log(err)
                                              )

                                              // email notification

                                              // const msg = {
                                              //   to: payments.rows[e].email,
                                              //   from: 'payments@leonardo.fund',
                                              //   subject: 'Leonardo :: Update access',
                                              //   text: `Your access: ${config_keys_access[i]}`,
                                              //   html: `Your access: ${config_keys_access[i]}`,
                                              // }
                                              // sgMail.send(msg)

                                            }
                                          }
                                        },
                                        err => console.log(err)
                                      )

                                    }else{
                                      db.delete('paymentsconfirm', { pay_id: payments.rows[e].id })
                                      console.log('test del 2')
                                    }
                                  }else{
                                    db.delete('paymentsconfirm', { pay_id: payments.rows[e].id })
                                    console.log('test del 3')
                                  }
                                }
                              },
                              err => console.log(err)
                            )
                          }
                        }
                      }
                    }
                  }
                }
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
}, 60000)
