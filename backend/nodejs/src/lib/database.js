// npm init
// npm i pg --save
// npm i sql-query-generator --save
// npm i sql --save

//   Require code index.js:
//
//   const DataBase = require('......../database.js')
//   const db = new DataBase({
//      user     : process.env.POSTGRES_DB_USER,
//      host     : process.env.POSTGRES_DB_HOST,
//      database : process.env.POSTGRES_DB_TABLE,
//      password : process.env.POSTGRES_DB_PASS,
//      port     : process.env.POSTGRES_DB_PORT,
//   })

//   Methods:
//
// db.add('users', { name: 'vasya', email: 'vasya@gmail.com' })
// db.get('users', { name: 'vasya' }, ['id', 'email'])
// db.get('users', { name: 'vasya' })
// db.update('users', { name: 'vasya pupkin' }, { email: 'vasya@gmail.com' })
// db.delete('users', { email: 'vasya@gmail.com' })
//


const { Pool, Client }  = require('pg')
const sqlQueryGenerator = require('sql-query-generator')
const sqlGenerator      = require('sql')



sqlGenerator.setDialect('postgres')
sqlQueryGenerator.use('postgres')



class DataBase {

  constructor(params) {
    this.base = new Pool(params)
  }

  query (text) {
    return new Promise((resolve, reject) => {
      this.base.query(text, (err, res) => {
        if (err) reject(err)
        resolve(res)
      })
    })
  }

  queryValues (text, values) {
    return new Promise((resolve, reject) => {
      this.base.query(text, values, (err, res) => {
        if (err) reject(err)
        resolve(res)
      })
    })
  }

  get (type, data, res='*') {
    return new Promise((resolve, reject) => {
      let sql = sqlQueryGenerator.select(type, res).where(data)
      this.queryValues(sql.text, sql.values)
      .then(
        success => resolve(success),
        err     => reject(err)
      )
    })
  }

  add (type, data) {
    return new Promise((resolve, reject) => {
      let sql = sqlQueryGenerator.insert(type, data).returning('*')

      console.log(sql.text, sql.values)
      this.queryValues(sql.text, sql.values)
      .then(
        success => resolve(success),
        err     => {
          console.log('ERR')
          console.log(err)
          data = Object.keys(data)
          let config = ''
          for (let i = 0; i <= data.length; i++) {
            if (i == data.length) {
              console.log(`CREATE TABLE ${type} ( ${config}id serial PRIMARY KEY NOT NULL)`)
              this.query(`CREATE TABLE ${type} ( ${config}id serial PRIMARY KEY NOT NULL)`)
              .then(
                createTable => {
                  console.log(createTable);
                  this.queryValues(sql.text, sql.values)
                  .then(
                    success => resolve(success),
                    err     => {
                      console.log(err)
                      setTimeout(() => {
                        this.queryValues(sql.text, sql.values)
                        .then(
                          success => console.log(success),
                          err     => console.log(err)
                        )
                      }, 10000)
                    }
                  )
                },
                err => {
                  console.log(err)
                  reject('err')
                }
              )
            }else{
              config = config+`${data[i]} text, `
            }
          }
        }
      )
    })
  }

  update (type, data, where) {
    return new Promise((resolve, reject) => {
      let sql = sqlQueryGenerator.update(type, data).where(where)
      this.queryValues(sql.text, sql.values)
      .then(
        success => resolve(success),
        err     => reject(err)
      )
    })
  }

  delete (type, where) {
    return new Promise((resolve, reject) => {
      let sql = sqlQueryGenerator.deletes(type).where(where)
      this.queryValues(sql.text, sql.values)
      .then(
        success => resolve(success),
        err     => reject(err)
      )
    })
  }

  drop (type) {
    return new Promise((resolve, reject) => {
      console.log(`DROP TABLE ${type}`)
      this.query(`DROP TABLE ${type}`)
      .then(
        del => {
          console.log(del);
          resolve(del)
        },
        err => {
          console.log(err)
          reject('err')
        }
      )
    })
  }

}

module.exports = DataBase
