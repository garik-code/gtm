require('dotenv').config({path: '.env'})

const DataBase   = require('../database')
const Memcached  = require('../memcached')

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

const fs = require('fs')
let configRewards = []

fs.readFile(`${__dirname}/config.json`, 'utf8', (err, config) => {
  configRewards = JSON.parse(config)
})

exports.config = () => {
  return configRewards
}

exports.bonusLinesPackages = (name, package, email, usdt) => {
  return new Promise((resolve, reject) => {
    this.fetchLines(email)
    .then(
      fetchPartners => {
        this.calculateRewardLinesPackages(fetchPartners, usdt, 'USDT')
        .then(
          calculateRewardLinesPackages => {

            console.log('-------');

            console.log(calculateRewardLinesPackages);

            let timeout = 0

            for (let x = 0; x < calculateRewardLinesPackages.length; x++) {

              let email  = calculateRewardLinesPackages[x].email
              let usdt   = calculateRewardLinesPackages[x].usdt
              let leo = calculateRewardLinesPackages[x].leo
              let amount = calculateRewardLinesPackages[x].amount


              let time = Math.floor(new Date() / 1000)
              time = time + 31536000

              timeout = timeout + 2000

              setTimeout(() => {

                db.add('transactions_igor', {
                  date: time,
                  ru: `+ ${usdt} USDT`,
                  type: 'true',
                  status: 'Success',
                  description: `Partner buy package ${package}: ${name}`,
                  email: email,
                }).then(s => {}, e => {})

                db.add('transactions_igor', {
                  date: time,
                  ru: `+ ${leo} coin`,
                  type: 'freezed',
                  status: 'Success',
                  description: `Partner buy package ${package}: ${name}`,
                  email: email,
                }).then(s => {}, e => {})

                db.get('finance_igor', { email: email }).then(
                  finance_igor => {
                    if (finance_igor.rows.length == 0) {
                      db.add('finance_igor', {
                        sum: usdt,
                        available: usdt,
                        freezed: '0',
                        waiting_withdraw: '0',
                        withdrawed: '0',
                        email: email,
                      }).then(s => {}, e => {})
                    }else{
                      db.update('finance_igor', {
                        sum: parseFloat(finance_igor.rows[0].sum) + parseFloat(usdt),
                        available: parseFloat(finance_igor.rows[0].available) + parseFloat(usdt),
                        freezed: parseFloat(finance_igor.rows[0].freezed),
                        waiting_withdraw: parseFloat(finance_igor.rows[0].waiting_withdraw),
                        withdrawed: parseFloat(finance_igor.rows[0].withdrawed),
                        email: email,
                      }, { id: finance_igor.rows[0].id }).then(s => {}, e => {})
                    }
                  },
                  e => {
                    db.add('finance_igor', {
                      sum: usdt,
                      available: usdt,
                      freezed: '0',
                      waiting_withdraw: '0',
                      withdrawed: '0',
                      email: email,
                    }).then(s => {}, e => {})
                  }
                )

                db.get('leo_finance_igor', { email: email }).then(
                  finance_igor => {
                    if (finance_igor.rows.length == 0) {
                      db.add('leo_finance_igor', {
                        leo_sum: leo,
                        leo_available: '0',
                        leo_freezed: leo,
                        leo_waiting_withdraw: '0',
                        leo_withdrawed: '0',
                        email: email,
                      }).then(s => {}, e => {})
                    }else{
                      db.update('leo_finance_igor', {
                        leo_sum: parseFloat(finance_igor.rows[0].leo_sum) + parseFloat(leo),
                        leo_available: parseFloat(finance_igor.rows[0].leo_available),
                        leo_freezed: parseFloat(finance_igor.rows[0].leo_freezed) + parseFloat(leo),
                        leo_waiting_withdraw: parseFloat(finance_igor.rows[0].leo_waiting_withdraw),
                        leo_withdrawed: parseFloat(finance_igor.rows[0].leo_withdrawed),
                        email: email,
                      }, { id: finance_igor.rows[0].id }).then(s => {}, e => {})
                    }
                  },
                  e => {
                    db.add('leo_finance_igor', {
                      leo_sum: leo,
                      leo_available: '0',
                      leo_freezed: leo,
                      leo_waiting_withdraw: '0',
                      leo_withdrawed: '0',
                      email: email,
                    }).then(s => {}, e => {})
                  }
                )

              }, timeout)

            }
          },
          err => console.log(err)
        )
      },
      err => console.log(err)
    )
  })
}

exports.bonusLinesAccess = (name, package, email, usdt) => {
  return new Promise((resolve, reject) => {
    this.fetchLines(email)
    .then(
      fetchPartners => {
        this.calculateRewardLinesAccess(fetchPartners, usdt, 'USDT')
        .then(
          calculateRewardLinesAccess => {

            console.log('-------');

            console.log(calculateRewardLinesAccess);

            let timeout = 0

            for (let x = 0; x < calculateRewardLinesAccess.length; x++) {

              let email_user = email
              email  = calculateRewardLinesAccess[x].email
              let usdt   = calculateRewardLinesAccess[x].usdt
              let leo = calculateRewardLinesAccess[x].leo
              let amount = calculateRewardLinesAccess[x].amount


              let time = Math.floor(new Date() / 1000)
              time = time + 31536000

              timeout = timeout + 2000

              setTimeout(() => {

                db.add('transactions_igor', {
                  date: time,
                  ru: `+ ${usdt} USDT`,
                  type: 'true',
                  status: 'Success',
                  description: `Partner buy package ${package}: ${name}`,
                  email: email,
                }).then(s => {}, e => {})

                db.add('transactions_igor', {
                  date: time,
                  ru: `+ ${leo} coin`,
                  type: 'freezed',
                  status: 'Success',
                  description: `Partner buy package ${package}: ${name}`,
                  email: email,
                }).then(s => {}, e => {})

                db.get('finance_igor', { email: email }).then(
                  finance_igor => {
                    if (finance_igor.rows.length == 0) {
                      db.add('finance_igor', {
                        sum: usdt,
                        available: usdt,
                        freezed: '0',
                        waiting_withdraw: '0',
                        withdrawed: '0',
                        email: email,
                      }).then(s => {}, e => {})
                    }else{
                      db.update('finance_igor', {
                        sum: parseFloat(finance_igor.rows[0].sum) + parseFloat(usdt),
                        available: parseFloat(finance_igor.rows[0].available) + parseFloat(usdt),
                        freezed: parseFloat(finance_igor.rows[0].freezed),
                        waiting_withdraw: parseFloat(finance_igor.rows[0].waiting_withdraw),
                        withdrawed: parseFloat(finance_igor.rows[0].withdrawed),
                        email: email,
                      }, { id: finance_igor.rows[0].id }).then(s => {}, e => {})
                    }
                  },
                  e => {
                    db.add('finance_igor', {
                      sum: usdt,
                      available: usdt,
                      freezed: '0',
                      waiting_withdraw: '0',
                      withdrawed: '0',
                      email: email,
                    }).then(s => {}, e => {})
                  }
                )

                db.get('leo_finance_igor', { email: email }).then(
                  finance_igor => {
                    if (finance_igor.rows.length == 0) {
                      db.add('leo_finance_igor', {
                        leo_sum: leo,
                        leo_available: '0',
                        leo_freezed: leo,
                        leo_waiting_withdraw: '0',
                        leo_withdrawed: '0',
                        email: email,
                      }).then(s => {}, e => {})
                    }else{
                      db.update('leo_finance_igor', {
                        leo_sum: parseFloat(finance_igor.rows[0].leo_sum) + parseFloat(leo),
                        leo_available: parseFloat(finance_igor.rows[0].leo_available),
                        leo_freezed: parseFloat(finance_igor.rows[0].leo_freezed) + parseFloat(leo),
                        leo_waiting_withdraw: parseFloat(finance_igor.rows[0].leo_waiting_withdraw),
                        leo_withdrawed: parseFloat(finance_igor.rows[0].leo_withdrawed),
                        email: email,
                      }, { id: finance_igor.rows[0].id }).then(s => {}, e => {})
                    }
                  },
                  e => {
                    db.add('leo_finance_igor', {
                      leo_sum: leo,
                      leo_available: '0',
                      leo_freezed: leo,
                      leo_waiting_withdraw: '0',
                      leo_withdrawed: '0',
                      email: email,
                    }).then(s => {}, e => {})
                  }
                )

              }, timeout)

              // // email notification managers
              // const msg = {
              //   to: email,
              //   from: 'payments@leonardo.fund',
              //   subject: 'Leonardo :: New transaction',
              //   text: `+ ${amount} PV`,
              //   html: `<strong>+ ${amount} PV</strong>`,
              // }
              // sgMail.send(msg)

            }
          },
          err => console.log(err)
        )
      },
      err => console.log(err)
    )
  })
}

exports.fetchLines = (first, line=1, result=[]) => {
  let lines = configRewards.lines
  return new Promise((resolve, reject) => {
    db.get('users', { email: first, status: 1 })
    .then(
      user => {
        if (line > lines) {
          resolve(result)
        }else{
          if (typeof user.rows[0] == 'undefined') {
            resolve(result)
          }else{
            if (user.rows[0].partner != 'undefined' && user.rows[0].partner != '') {
              result.push(user.rows[0].partner)
              line++
              exports.fetchLines(user.rows[0].partner, line, result)
              .then(
                fetchPartners => resolve(fetchPartners),
                err => reject(err)
              )
            }else{
              resolve(result)
            }
          }
        }
      },
      err => console.log(err)
    )
  })
}

exports.fetchAllLinesActive = (first, line=1, result=[]) => {
  return new Promise((resolve, reject) => {
    db.get('users', { partner: first, status: 1 })
    .then(
      user => {
        if (typeof user.rows[0] == 'undefined') {
          reject('undefined')
        }else{
          let array = user.rows
          let res = []
          for (let i = 0; i <= array.length; i++) {
            if (i == array.length) {
              resolve(res)
            }else{
              if (first != array[i].email) {
                res.push({
                  id: array[i].id,
                  name: array[i].name,
                  phone: array[i].phone,
                  email: array[i].email,
                  avatar: array[i].avatar
                })
              }
            }
          }
        }
      },
      err => console.log(err)
    )
  })
}

exports.fetchAllLinesInActive = (first, line=1, result=[]) => {
  return new Promise((resolve, reject) => {
    db.get('users', { partner: first, status: 0 })
    .then(
      user => {
        if (typeof user.rows[0] == 'undefined') {
          reject('undefined')
        }else{
          let array = user.rows
          let res = []
          for (let i = 0; i <= array.length; i++) {
            if (i == array.length) {
              resolve(res)
            }else{
              if (first != array[i].email) {
                res.push({
                  id: array[i].id,
                  name: array[i].name,
                  phone: array[i].phone,
                  email: array[i].email,
                  avatar: array[i].avatar
                })
              }
            }
          }
        }
      },
      err => console.log(err)
    )
  })
}

exports.calculateRewardLinesAccess = (lines, amount, currency) => {
  return new Promise((resolve, reject) => {
    let res = []
    const cycle = (i) => {
      if (i == lines.length) {
        resolve(res)
      }else{
        db.get('packages', { email: lines[i] })
        .then(
          packageUser => {
            let time = Math.floor(new Date() / 1000)
            packageUser = packageUser.rows[packageUser.rows.length - 1]
            if (typeof packageUser != 'undefined' && packageUser.unix > time) {
              packageUser = packageUser.type
              let lineStructure = i+1
              if (typeof configRewards.access[packageUser] == 'undefined') cycle(i+1)
              if (configRewards.access[packageUser].lines.length >= lineStructure) {
                let percent = configRewards.access[packageUser].lines[i]
                let invest  = configRewards.access[packageUser].invest[i]
                let email   = lines[i]
                let amount_user = parseFloat(amount) / 100 * parseFloat(percent)
                let amount_currency = parseFloat(amount_user) / 100 * (100 - parseFloat(invest))
                let amount_invest = parseFloat(amount_user) - parseFloat(amount_currency)
                res.push({
                  email: email,
                  line: lineStructure,
                  usdt: parseFloat(amount_currency).toFixed(3),
                  leo: parseFloat(amount_invest).toFixed(3)
                })
                cycle(i+1)
              }else{
                cycle(i+1)
              }
            }else{
              cycle(i+1)
            }
          },
          err => cycle(i+1)
        )
      }
    }
    cycle(0)
  })
}

exports.calculateRewardLinesPackages = (lines, amount, currency) => {
  return new Promise((resolve, reject) => {
    let res = []
    const cycle = (i) => {
      if (i == lines.length) {
        resolve(res)
      }else{
        db.get('packages', { email: lines[i] })
        .then(
          packageUser => {
            let time = Math.floor(new Date() / 1000)
            packageUser = packageUser.rows[packageUser.rows.length - 1]
            if (typeof packageUser != 'undefined' && packageUser.unix > time) {
              packageUser = packageUser.type
              let lineStructure = i+1
              if (typeof configRewards.packages[packageUser] == 'undefined') cycle(i+1)
              if (configRewards.packages[packageUser].lines.length >= lineStructure) {
                let percent = configRewards.packages[packageUser].lines[i]
                let invest  = configRewards.packages[packageUser].invest[i]
                let email   = lines[i]
                let amount_user = parseFloat(amount) / 100 * parseFloat(percent)
                let amount_currency = parseFloat(amount_user) / 100 * (100 - parseFloat(invest))
                let amount_invest = parseFloat(amount_user) - parseFloat(amount_currency)
                res.push({
                  email: email,
                  line: lineStructure,
                  usdt: parseFloat(amount_currency).toFixed(3),
                  leo: parseFloat(amount_invest).toFixed(3)
                })
                cycle(i+1)
              }else{
                cycle(i+1)
              }
            }else{
              cycle(i+1)
            }
          },
          err => cycle(i+1)
        )
      }
    }
    cycle(0)
  })
}
