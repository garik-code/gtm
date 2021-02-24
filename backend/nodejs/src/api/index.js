require('dotenv').config({path: '.env'})

const DataBase   = require('../lib/database')
const Memcached  = require('../lib/memcached')
const Partners   = require('../lib/partners')
const Pay        = require('../pay/lib/core')

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

const request     = require('request')
const express     = require('express')
const fileUpload  = require('express-fileupload')
const routeCache  = require('route-cache')
const cors        = require('cors')
const rateLimit   = require('express-rate-limit')
const gravatar    = require('gravatar')
const sgMail      = require('@sendgrid/mail')
const token       = require('token')
const fingerPrint = require('express-fingerprint')
const password    = require('secure-random-password')
const querystring = require('querystring')

token.defaults.secret = 'igor secret code 777'
token.defaults.timeStep = 72 * 60 * 60

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { err: 'Activity detected. 😂😂😂', support: 'mail@garik.site' }
})
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { err: 'Activity detected. 😂😂😂', support: 'mail@garik.site' }
})
const regLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { err: 'Activity detected. 😂😂😂', support: 'mail@garik.site' }
})
const payLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { err: 'Activity detected. 😂😂😂', support: 'mail@garik.site' }
})

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const app = express()

app.use(cors())
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 },
  useTempFiles : true,
  tempFileDir : '/tmp/'
}))
// app.use(limiter)
// app.use('/auth', authLimiter)
// app.use('/reg', regLimiter)
// app.use('/pay/create', payLimiter)
app.use(fingerPrint({
  parameters:[
    fingerPrint.useragent,
    fingerPrint.acceptHeaders,
    fingerPrint.geoip
  ]
}))

Object.prototype.removeIds = function (data) {
  for (let i = 0; i <= data.length; i++) {
    if (i == data.length) {
      return this
    }else{
      delete this[data[i]]
    }
  }
}

// db.delete('phoneconfirm', { phone: '79636228193' }).then(s => console.log(s), e => {})
// db.delete('users', { phone: '79636228193' }).then(s => console.log(s), e => {})

app.post('/create/link', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.url == 'undefined') {
    res.json({ err: 'url' })
  }
  res.json({ success: true, url: `https://metrics.leonardo.fund/link/${Buffer.from(req.body.url).toString('base64')}` })
})

app.get('/link/:hash', (req, res) => {
  if (typeof req.params == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.params.hash == 'undefined') {
    res.json({ err: 'url' })
  }
  res.redirect(Buffer.from(req.params.hash, 'base64').toString('ascii'))
})

app.post('/auth', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  if (typeof req.body.passw == 'undefined') {
    res.json({ err: 'passw' })
  }
  db.get('users', { phone: req.body.phone, passw: req.body.passw, status: 1 })
  .then(
    auth => {
      if (auth.rows.length > 0) {
        res.json({ id: auth.rows[0].id, name: auth.rows[0].name, avatar: auth.rows[0].avatar, email: auth.rows[0].email, access_token: token.generate(`${auth.rows[0].id}|${req.fingerprint.hash}|${auth.rows[0].email}`) })
      }else{
        res.json({ err: 'password is not correct' })
      }
    },
    err => {
      console.log(err)
    }
  )
})

app.post('/forgot/code', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  db.get('users', { phone: req.body.phone, status: 1 })
  .then(
    auth => {
      if (auth.rows.length > 0) {

        let code = Math.random() * (999999 - 111111) + 111111
            code = code.toFixed(0)
        db.add('phoneconfirm', { phone: req.body.phone, code: code }).then( s => console.log(s), e => {} )

        request.get(`https://sms.ru/sms/send?api_id=${process.env.SMS_RU}&to=${parseInt(req.body.phone)}&msg=${code}&json=1`)

        res.json({ success: true })

      }else{
        res.json({ err: 'password is not correct' })
      }
    },
    err => {
      console.log(err)
    }
  )
})

app.post('/forgot/verify', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  if (typeof req.body.code == 'undefined') {
    res.json({ err: 'code' })
  }
  console.log({ phone: req.body.phone, code: req.body.code });
  db.get('phoneconfirm', { phone: req.body.phone, code: req.body.code })
  .then(
    searchPhone => {
      if (searchPhone.rows.length == 0) {
        res.json({ err: 'phone confirm' })
      }else{
        let password_generator = password.randomPassword()
        console.log(password_generator);
        db.update('users', { passw: password_generator }, { phone: req.body.phone, status: 1 })
        .then(
          success => {
            db.delete('phoneconfirm', { phone: req.body.phone }).then(s => {}, e => {})
            res.json({ success: true })
            let q = querystring.stringify({ api_id: process.env.SMS_RU, to: parseInt(req.body.phone), msg: `${password_generator}`, json: 1 })
            console.log(q);
            request.get(`https://sms.ru/sms/send?${q}`)
          },
          err => console.log(err)
        )

      }
    }
  )
})

app.post('/security', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
          res.json({ success: true, id: fetchUser.rows[0].id, name: fetchUser.rows[0].name, avatar: fetchUser.rows[0].avatar, email: fetchUser.rows[0].email, phone: fetchUser.rows[0].phone, partner: fetchUser.rows[0].partner, access_token: req.body.access_token })
        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    }
  )
})

app.post('/reg/email', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.partner == 'undefined') {
    res.json({ err: 'partner' })
    db.add('emailforbidden', { email: req.body.email }).then( s => {}, e => {} )
  }
  db.get('users', { email: req.body.partner, status: 1 })
  .then(
    partner => {
      if (partner.rows.length != 0) {
        db.get('users', { email: req.body.email, status: 1 })
        .then(
          searchEmail => {
            if (searchEmail.rows.length == 0) {
              let code = Math.random() * (999999 - 111111) + 111111
                  code = code.toFixed(0)
              db.add('emailconfirm', { email: req.body.email, code: code }).then( s => {}, e => {} )

              const msg = {
                to: req.body.email,
                from: 'welcome@leonardo.fund',
                subject: 'Leonardo :: Email verification',
                text: `Code: ${code}`,
                html: `<strong>Code: ${code}</strong>`,
              }
              sgMail.send(msg)

              res.json({ success: true })

            }else{
              res.json({ err: 'email exist' })
            }
          },
          err => res.json({ err: 'email' })
        )
      }else{
        res.json({ err: 'partner' })
        db.add('emailforbidden', { email: req.body.email }).then( s => {}, e => {} )
      }
    },
    err => {
      res.json({ err: 'partner' })
      db.add('emailforbidden', { email: req.body.email }).then( s => {}, e => {} )
    }
  )
})

app.post('/reg', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.name == 'undefined') {
    res.json({ err: 'name' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.emailcode == 'undefined') {
    res.json({ err: 'email code' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  if (typeof req.body.passw == 'undefined') {
    res.json({ err: 'password' })
  }
  if (typeof req.body.partner == 'undefined') {
    res.json({ err: 'partner' })
  }

  let avatar = gravatar.url(req.body.email, {s: '100', r: 'x', d: 'retro'}, true)

  db.get('users', { phone: req.body.phone, status: 1 })
  .then(
    searchPhone => {
      if (searchPhone.rows.length == 0) {
        // db.get('emailconfirm', { email: req.body.email, code: req.body.emailcode })
        // .then(
        //   checkEmailCode => {
        //     if (checkEmailCode.rows.length == 0) {
        //       res.json({ err: 'email code' })
        //     }else{ //
              // db.delete('emailconfirm', { email: req.body.email }).then(s => {}, e => {})
              let code = Math.random() * (999999 - 111111) + 111111
                  code = code.toFixed(0)
              db.add('phoneconfirm', { phone: req.body.phone, code: code }).then( s => {}, e => {} )

              request.get(`https://sms.ru/sms/send?api_id=${process.env.SMS_RU}&to=${parseInt(req.body.phone)}&msg=Leonardo+${code}&json=1`)

              db.add('users', {
                name    : req.body.name,
                email   : req.body.email,
                phone   : req.body.phone,
                passw   : req.body.passw,
                partner : req.body.partner,
                avatar  : avatar,
                type    : 0,
                status  : 0,
                auth    : 0
              })
              .then(
                s => {},
                e => {}
              )

              res.json({ success: true })

        //    } //
        //   },
        //   err => console.log(err)
        // )
      }else{
        res.json({ err: 'phone exist' })
      }
    },
    err => console.log(err)
  )
})

app.post('/reg/confirm', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  if (typeof req.body.code == 'undefined') {
    res.json({ err: 'code' })
  }
  db.get('phoneconfirm', { phone: req.body.phone, code: req.body.code })
  .then(
    searchPhone => {
      if (searchPhone.rows.length == 0) {
        res.json({ err: 'phone confirm' })
      }else{
        db.delete('phoneconfirm', { phone: req.body.phone, code: req.body.code }).then(s => {}, e => {})
        db.update('users', { status: 1 }, { phone: req.body.phone })
        .then(
          update => {
            db.get('users', { phone: req.body.phone, status: 1 })
            .then(
              auth => {
                console.log('auth')
                console.log(auth)
                if (auth.rows.length > 0) {

                  db.add('partners_binary', {
                    name: auth.rows[0].name,
                    user_id: auth.rows[0].id,
                    mail: auth.rows[0].email,
                    contact: auth.rows[0].phone,
                    status: "2",
                    avatar: auth.rows[0].avatar,
                    email: auth.rows[0].partner
                  })
                  .then(
                    s => console.log(s),
                    e => console.log(e)
                  )

                  res.json({ success: true, name: auth.rows[0].name, avatar: auth.rows[0].avatar, email: auth.rows[0].email, access_token: token.generate(`${auth.rows[0].id}|${req.fingerprint.hash}|${auth.rows[0].email}`) })
                }else{
                  res.json({ err: 'auth' })
                }
              },
              err => {
                res.json({ err: 'auth' })
              }
            )
          },
          e => res.json({ err: 'auth' })
        )
      }
    },
    err => res.json({ err: 'error confirm' })
  )
})

app.get('/pay/methods', routeCache.cacheSeconds(60000), (req, res) => {
  Pay.fetchCoins()
  .then(
    s => res.json(s),
    e => res.json(e)
  )
})

app.get('/pay/withdraw', routeCache.cacheSeconds(60000), (req, res) => {
  Pay.fetchCoinsWithdraw()
  .then(
    s => res.json(s),
    e => res.json(e)
  )
})

app.post('/pay/create', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'passw' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.coin == 'undefined') {
    res.json({ err: 'coin' })
  }
  if (typeof req.body.dollars == 'undefined') {
    res.json({ err: 'dollars' })
  }
  console.log({ email: req.body.email, status: 1 });
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      console.log(fetchUser.rows)
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          Pay.calculate(req.body.coin, req.body.dollars)
          .then(
            calculate => {
              Pay.fetchDepositAddress(req.body.coin)
              .then(
                fetchDepositAddress => {

                  db.add('payments', {
                    amount: calculate,
                    currency: fetchDepositAddress.currency,
                    address: fetchDepositAddress.address,
                    explorer: fetchDepositAddress['info'].url,
                    tag: fetchDepositAddress.tag,
                    name: fetchUser.rows[0].name,
                    avatar: fetchUser.rows[0].avatar,
                    status: 0,
                    email: fetchUser.rows[0].email,
                    access_token: req.body.access_token,
                    device: req.fingerprint,
                    type: 'crypto'
                  })
                  .then(
                     create => res.json(create.rows[0].removeIds(['access_token', 'device', 'status'])),
                     err => res.json({ err: 'db', code: err })
                  )

                },
                e => res.json({ err: 'calc' })
              )
            },
            e => res.json({ err: 'calc' })
          )

        }else{
          res.json({ err: 'access token is not correct 1' })
        }
      }else{
        res.json({ err: 'access token is not correct 2' })
      }
    }
  )
})

app.post('/pay/confirm', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'passw' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.pay_id == 'undefined') {
    res.json({ err: 'pay_id' })
  }
  if (typeof req.body.info == 'undefined') {
    res.json({ err: 'info' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          db.update('payments', { status: 1 }, { status: 0, id: req.body.pay_id }).then(s => {}, e => {})

          db.add('paymentsconfirm', {
            pay_id: req.body.pay_id,
            info: req.body.info,
            status: 0,
            email: fetchUser.rows[0].email,
            access_token: req.body.access_token,
            device: req.fingerprint,
          })
          .then(
             create => res.json(create.rows[0].removeIds(['access_token', 'device', 'status'])),
             err => res.json({ err: 'db', code: err })
          )

        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/status', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.type == 'undefined' || req.body.type != 'partners_binary') {
    res.json({ err: 'type' })
  }
  if (typeof req.body.id == 'undefined') {
    res.json({ err: 'id' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          let unix = Date.now()

          db.update (req.body.type, { status: '1' }, { status: '0', id: parseInt(req.body.id) })
          .then(
            update => res.json({ success: true }),
            err    => res.json({ err: 'db', code: err })
          )

        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/add', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.data == 'undefined') {
    res.json({ err: 'data' })
  }else{
    try {
      req.body.data = JSON.parse(req.body.data)
    } catch (e) {
      res.json({ err: 'data' })
    }
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
    
          req.body.data.email = req.body.email
          req.body.data.unix = Date.now()

          console.log(req.body.name);
          console.log(req.body.data);

          db.add(req.body.name, req.body.data)
          .then(
            create => res.json(create.rows[0]),
            err    => res.json({ err: 'db', code: err })
          )

        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/partner/info', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.ref == 'undefined') {
    res.json({ err: 'ref' })
  }
  db.get('users', { email: req.body.ref, status: 1 })
  .then(
    fetchUser => {
      if (typeof fetchUser.rows[0] == 'undefined') {
        res.json({ err: 'ref' })
      }else{
        res.json({
          success: true,
          name: fetchUser.rows[0].name,
          avatar: fetchUser.rows[0].avatar,
          phone: fetchUser.rows[0].phone
        })
      }
    },
    err => res.json({ err: 'ref is not correct' })
  )
})

app.post('/get', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.name == 'undefined' && req.body.name != 'users' && req.body.name != 'user') {
    res.json({ err: 'name' })
  }
  if (typeof req.body.data == 'undefined') {
    res.json({ err: 'data' })
  }else{
    try {
      req.body.data = JSON.parse(req.body.data)
    } catch (e) {
      res.json({ err: 'data' })
    }
  }
  // if (
  //      req.body.name != 'packages'
  //   && req.body.name != 'leo_finance_igor'
  //   && req.body.name != 'finance_igor'
  //   && req.body.name != 'transactions_igor'
  //   && req.body.name != 'partners_binary'
  //   && req.body.name != 'smart_id'
  //   && req.body.name != 'actual_binary_tree'
  // ) {
  //   res.json({ err: 'access token is not correct' })
  // }

  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          if(req.body.name == 'actual_binary_tree'){
            req.body.data.tag = 'binary'
          }else{
            req.body.data.email = req.body.email
          }

          console.log(req.body.name);
          console.log(req.body.data);

          db.get(req.body.name, req.body.data)
          .then(
            fetch => res.json(fetch.rows),
            err   => res.json({ err: 'db', code: err })
          )

        }else{
          res.json({ err: 'access token is not correct 1' })
        }
      }else{
        res.json({ err: 'access token is not correct 2' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/change/avatar', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (req.files == null || typeof req.files.avatar == 'undefined') {
    res.json({ err: 'avatar' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          let sampleFile;
          let uploadPath;

          if (!req.files || Object.keys(req.files).length === 0 || typeof req.files.avatar == 'undefined') {
            res.json({ err: 'avatar' })
          }

          sampleFile = req.files.avatar

          if (sampleFile.mimetype.split('/')[0] == 'image') {
            uploadPath = `/var/www/avatar/${sampleFile.md5}.png`
            sampleFile.mv(uploadPath, function(err) {
              if (err) {
                res.json({ err: 'avatar' })
              }
              db.update ('users', { avatar: `https://avatar.leonardo.fund/${sampleFile.md5}.png` }, { email: req.body.email, status: 1 })
              .then(
                update => res.json({ success: true  }),
                err    => res.json({ err: 'db', code: err })
              )
              res.send({ success: true, url: `https://avatar.leonardo.fund/${sampleFile.md5}.png` })
            })
          }else{
            res.json({ err: 'avatar' })
          }
        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    }
  )
})

app.post('/change/password', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.passw == 'undefined') {
    res.json({ err: 'passw' })
  }
  if (typeof req.body.new_passw == 'undefined') {
    res.json({ err: 'new passw' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
          if (fetchUser.rows[0].passw != req.body.passw) {
            res.json({ err: 'passw' })
          }else{
            db.update ('users', { passw: req.body.new_passw }, { email: req.body.email, status: 1 })
            .then(
              update => res.json({ success: true  }),
              err    => res.json({ err: 'db', code: err })
            )
          }
        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/change/name', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.name == 'undefined') {
    res.json({ err: 'name' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
          db.update ('users', { name: req.body.name }, { email: req.body.email, status: 1 })
          .then(
            update => res.json({ success: true  }),
            err    => res.json({ err: 'db', code: err })
          )
        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/change/phone/create', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
          db.get('users', { phone: req.body.phone, status: 1 })
          .then(
            fetchUsers => {
              if(fetchUsers.rows.length == 0){
                let code = Math.random() * (999999 - 111111) + 111111
                    code = code.toFixed(0)
                db.add('phoneconfirm', { phone: req.body.phone, code: code }).then( s => console.log(s.rows), e => {} )
                request.get(`https://sms.ru/sms/send?api_id=${process.env.SMS_RU}&to=${parseInt(req.body.phone)}&msg=Leonardo+${code}&json=1`)
                res.json({ success: true })
              }else{
                res.json({ err: 'phone exist' })
              }
            },
            err => console.log(err)
          )
        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/change/phone/confirm', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  if (typeof req.body.phone == 'undefined') {
    res.json({ err: 'phone' })
  }
  if (typeof req.body.code == 'undefined') {
    res.json({ err: 'code' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {






          console.log(req.body);



          db.get('phoneconfirm', { phone: req.body.phone })
          .then(
            s => console.log(s.rows),
            e => console.log(e)
          )



          db.get('phoneconfirm', { phone: req.body.phone, code: req.body.code })
          .then(
            searchPhone => {
              console.log(searchPhone.rows);
              if (searchPhone.rows.length == 0) {
                res.json({ err: 'phone confirm' })
              }else{
                db.delete('phoneconfirm', { phone: req.body.phone, code: req.body.code }).then(s => {}, e => {})
                db.update ('users', { phone: req.body.phone }, { email: req.body.email, status: 1 })
                .then(
                  update => res.json({ success: true  }),
                  err    => res.json({ err: 'db', code: err })
                )
              }
            },
            err => console.log(err)
          )
        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/partners/active', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          db.get('partners_binary', { email: req.body.email, status: '1' })
          .then(
            partners_binary => res.json({ success: true, partners: partners_binary.rows }),
            err        => res.json({ err: 'partners' })
          )

        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

app.post('/partners/inactive', (req, res) => {
  if (typeof req.body == 'undefined') {
    res.json({ err: 'request' })
  }
  if (typeof req.body.email == 'undefined') {
    res.json({ err: 'email' })
  }
  if (typeof req.body.access_token == 'undefined') {
    res.json({ err: 'access_token' })
  }
  db.get('users', { email: req.body.email, status: 1 })
  .then(
    fetchUser => {
      if (fetchUser.rows.length > 0) {
        if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {

          db.get('partners_binary', { email: req.body.email, status: '2' })
          .then(
            partners_binary => res.json({ success: true, partners: partners_binary.rows }),
            err        => res.json({ err: 'partners' })
          )

        }else{
          res.json({ err: 'access token is not correct' })
        }
      }else{
        res.json({ err: 'access token is not correct' })
      }
    },
    err => res.json({ err: 'email is not correct' })
  )
})

/////////////
//
//
// app.post('/drop', (req, res) => {
//   if (typeof req.body == 'undefined') {
//     res.json({ err: 'request' })
//   }
//   if (typeof req.body.email == 'undefined') {
//     res.json({ err: 'email' })
//   }
//   if (typeof req.body.access_token == 'undefined') {
//     res.json({ err: 'access_token' })
//   }
//   if (typeof req.body.type == 'undefined') {
//     res.json({ err: 'type' })
//   }
//   db.get('users', { email: req.body.email, status: 1 })
//   .then(
//     fetchUser => {
//       if (fetchUser.rows.length > 0) {
//         if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
//
//           db.drop (req.body.type)
//           .then(
//             del => res.json({ success: true  }),
//             err    => res.json({ err: 'db', code: err })
//           )
//
//         }else{
//           res.json({ err: 'access token is not correct' })
//         }
//       }else{
//         res.json({ err: 'access token is not correct' })
//       }
//     },
//     err => res.json({ err: 'email is not correct' })
//   )
// })
//
//
// app.post('/delete', (req, res) => {
//   if (typeof req.body == 'undefined') {
//     res.json({ err: 'request' })
//   }
//   if (typeof req.body.email == 'undefined' || req.body.email != 'servers.leonardo@gmail.com') {
//     res.json({ err: 'email' })
//   }
//   if (typeof req.body.access_token == 'undefined') {
//     res.json({ err: 'access_token' })
//   }
//   if (typeof req.body.type == 'undefined') {
//     res.json({ err: 'type' })
//   }
//   if (typeof req.body.where == 'undefined') {
//     res.json({ err: 'where' })
//   }else{
//     try {
//       req.body.where = JSON.parse(req.body.where)
//     } catch (e) {
//       res.json({ err: 'where' })
//     }
//   }
//   db.get('users', { email: req.body.email, status: 1 })
//   .then(
//     fetchUser => {
//       if (fetchUser.rows.length > 0) {
//         if (token.verify(`${fetchUser.rows[0].id}|${req.fingerprint.hash}|${req.body.email}`, req.body.access_token)) {
//
//           console.log(req.body.type, req.body.where)
//
//           db.delete (req.body.type, req.body.where)
//           .then(
//             del => res.json({ success: true  }),
//             err    => res.json({ err: 'db', code: err })
//           )
//
//         }else{
//           res.json({ err: 'access token is not correct' })
//         }
//       }else{
//         res.json({ err: 'access token is not correct' })
//       }
//     },
//     err => res.json({ err: 'email is not correct' })
//   )
// })


/////////////

app.get('/cache', routeCache.cacheSeconds(3), (req, res, next) => {
  let unixtime = Math.floor(new Date() / 1000)
  res.send(`cache start ${unixtime}`)
})

app.listen(228)
