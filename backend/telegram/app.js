const Slimbot = require('slimbot');
const slimbot = new Slimbot('1470477649:AAG8ZiNOhTg4llC9MY5nCdYHWunoY3uOhQo');
const request = require('request');






// Auth


let access_token = ''
let email = ''

let options = {
  'method': 'POST',
  'url': 'http://nodejs-server:228/auth',
  'headers': {
  },
  formData: {
    'phone': '79995393646',
    'passw': 'servers.leonardo@gmail.com'
  }
};
request(options, function (error, response) {
  if (error) {
    console.log(error);
  }else{
    let data = JSON.parse(response.body)
    email = data.email;
    access_token = data.access_token;
  }
});

/////////////

const searchUser = (message, email, access_token) => {
  return new Promise(function(resolve, reject) {
    console.log(message, email, access_token);
    let options = {
      'method': 'POST',
      'url': 'http://nodejs-server:228/get',
      'headers': {
      },
      formData: {
        'email': email,
        'access_token': access_token,
        'name': 'telegram_users',
        'data': JSON.stringify({
          id_user: message.from.id
        })
      }
    };
    request(options, function (error, response) {
      if (error) {
        reject(error);
      }else{
        try {
          resolve(JSON.parse(response.body)[0])
        } catch (e) {
          reject(false)
        }
      }
    });
  });
}
const createUser = (message, email, access_token) => {
  return new Promise(function(resolve, reject) {
    console.log('create user: ');
    console.log(message, email, access_token);
    let options = {
      'method': 'POST',
      'url': 'http://nodejs-server:228/add',
      'headers': {
      },
      formData: {
        'email': email,
        'access_token': access_token,
        'name': 'telegram_users',
        'data': JSON.stringify({
          first_name: message.from.first_name,
          last_name: message.from.last_name,
          username: message.from.username,
          id_user: message.from.id
        }),
      }
    };
    request(options, function (error, response) {
      if (error) {
        reject(error);
      }else{
        resolve(response.body);
      }
    });
  });
}

/////////////

const search = (type, where, email, access_token) => {
  return new Promise(function(resolve, reject) {
    let options = {
      'method': 'POST',
      'url': 'http://nodejs-server:228/get',
      'headers': {
      },
      formData: {
        'email': email,
        'access_token': access_token,
        'name': type,
        'data': JSON.stringify(where)
      }
    };
    request(options, function (error, response) {
      if (error) {
        reject(error);
      }else{
        try {
          resolve(JSON.parse(response.body))
        } catch (e) {
          reject(false)
        }
      }
    });
  });
}
const create = (type, data, email, access_token) => {
  return new Promise(function(resolve, reject) {
    console.log('create user: ');
    console.log(message, email, access_token);
    let options = {
      'method': 'POST',
      'url': 'http://nodejs-server:228/add',
      'headers': {
      },
      formData: {
        'email': email,
        'access_token': access_token,
        'name':type,
        'data': JSON.stringify(data),
      }
    };
    request(options, function (error, response) {
      if (error) {
        reject(error);
      }else{
        resolve(response.body);
      }
    });
  });
}

/////////////

const sendHelloButton = (message, user) => {
  // define inline keyboard to send to user
  let whatPair = {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: [[
        { text: 'BTC/USDT', callback_data: 'pair_btc' },
        { text: 'ETH/USDT', callback_data: 'pair_eth' }
      ]]
    })
  };
  console.log('message -----');
  console.log(message);
  // reply when user sends a message, and send him our inline keyboard as well
  slimbot.sendMessage(message.from.id, `${user.first_name}, выберите пару`, whatPair);
}
const sendTimeFrame = (follow, query, mes='Выберите таймфрейм') => {
  let whatTime = {
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({
      inline_keyboard: [[
        { text: '1 день', callback_data: `timefraime_${follow}_1d` },
        { text: '7 дней', callback_data: `timefraime_${follow}_7d` },
        { text: '30 дней', callback_data: `timefraime_${follow}_30d` },
      ],
      [
        { text: '365 дней', callback_data: `timefraime_${follow}_365d` },
      ],
      [
        { text: 'Отмена', callback_data: `cancel_timefraime` },
      ]]
    })
  };
  if (follow == 'pair_btc') {
    mes = `Выберите таймфрейм для BTC/USDT`
  }
  if (follow == 'pair_eth') {
    mes = `Выберите таймфрейм для ETH/USDT`
  }
  slimbot.sendMessage(query.message.chat.id, mes, whatTime);
}

/////////////

setTimeout(()=>{

  // Register listener
  slimbot.on('message', message => {

    console.log('<-><-><-><-><-><-><-><->');
    console.log(message);
    console.log('<-><-><-><-><-><-><-><->');

    if (message.text == '/start') {
      searchUser(message, email, access_token).then(user => {
        if (typeof user == 'undefined') {
          createUser(message, email, access_token).then(create => {
            searchUser(message, email, access_token).then(user => {
              sendHelloButton(message, user)
            })
          }, err => console.log(err))
        }else{
          sendHelloButton(message, user)
        }
      }, err => {
        console.log(err)
        createUser(message, email, access_token).then(create => {
          searchUser(message, email, access_token).then(user => {
            sendHelloButton(message, user)
          })
        }, err => console.log(err))
      })
    }
  });

  ///////////

  // Because each inline keyboard button has callback data, you can listen for the callback data and do something with them

  slimbot.on('callback_query', query => {

    let type = query.data.split('_')
    console.log('type', type);

    if (type[0] == 'pair') {
      // Pair select
      sendTimeFrame(query.data, query)
    }else if(type[0] == 'timefraime'){

      // timeframe select
      console.log('<><><><><><>');
      console.log(query);
      // updateFollow(query, email, access_token)
      slimbot.sendMessage(query.message.chat.id, `data ${query.data}`);


    }else if(type[0] == 'cancel'){
      if (type[1] == 'timefraime') {
        searchUser(query, email, access_token).then(user => {
          sendHelloButton(query, user)
        })
      }
    }
  });

  // Call API
  slimbot.startPolling();

  // Now try talking to your bot, and click on the Hello button. Your bot should reply you with "Hello to you too!".

}, 5000)
