function auth() {
	apiAuth('79995393646', '1234').done(function(data, err) {
    $.cookie('email', data.email, { expires: 7, path: '/' })  // для работы на локалке
    // $.cookie('email', data.email, { expires: 7, path: '/', domain: '.leonardo.fund' })
    $.cookie('access_token', data.access_token, { expires: 7, path: '/' })  // для работы на локалке
    // $.cookie('access_token', data.access_token, { expires: 7, path: '/', domain: '.leonardo.fund' })
  })
}

function security() {
	apiSecurity().done(function(data, err) {
		if(data.success) {
			$.cookie('phone', data.phone, { expires: 7, path: '/' })  // для работы на локалке
			// $.cookie('phone', data.phone, { expires: 7, path: '/', domain: '.leonardo.fund' })
			localStorage.setItem('name', data.name)
			localStorage.setItem('avatar', data.avatar)
			localStorage.setItem('email', data.email)
			localStorage.setItem('user_id', data.id)
			localStorage.setItem('partner', data.partner)
		} else if(data.err) {
			swal({
				title: 'Ошибка',
				text: 'Доступ закрыт. Код ошибки: 10001',
				icon: 'error',
				button: false,
				timer: 3000
			})
			// setTimeout(function (){
			// 	location.href = 'https://login.leonardo.fund'
			// }, 2000)
		}
	})
}

function updateStorage(type, json) {
  apiGet(type, JSON.stringify(json)).done(function(data, err) {
    localStorage.setItem(type, JSON.stringify(data))
    console.log('test storage')
    console.log(localStorage.getItem(type))
  })
}

function del(el, type, href=false) {
  var id = el.id
	swal({
			title: "Удалить данные?",
			text: 'Восстановление невозможно',
			icon: "warning",
			buttons: true,
			dangerMode: true,
	})
	.then((willDelete) => {
		if (willDelete) {
			apiDelete(type, JSON.stringify({
				id: id
			})).done(function(data, err) {
				updateStorage(type, {})
				success('Данные удалены')
				if(href){
					setTimeout(function (){
						$('#hrefloading').click()
						setTimeout(function (){
							$('#href'+href).click()
						},150)
					}, 1500)
				}
			})
		}
	});

}

//////////////////

function error(mess){
  swal({
    title: 'Ошибка',
    text: mess,
    icon: 'error',
    button: false,
    timer: 3000
  })
}

function success(mess){
  swal({
    title: 'Отлично',
    text: mess,
    icon: 'success',
    button: false,
    timer: 3000
  })
}

function addStore() {
  var name = $('#newstorename').val()
  if (name == '') {
    error('Введите название склада')
  }else{
    apiAdd('store', JSON.stringify({
      name: name
    })).done(function(data, err) {
      updateStorage('store', {})
      success('Склад добавлен')
      $('#newstorename').val('')
			setTimeout(function (){
				$('#hrefloading').click()
				setTimeout(function (){
					$('#hrefstore').click()
				},150)
			}, 1500)
    })
  }
}

function addFace() {
  var facename = $('#facename').val()
  var faceid = $('#faceid').val()
  var facedesc = $('#facedesc').val()
  if (facename == '') {
    error('Введите название организации')
  }else if (faceid == '') {
    error('Введите ИНН')
  }else if (facedesc == '') {
    error('Введите реквизиты')
  }else{
    apiAdd('faces', JSON.stringify({
      name: facename,
      idcompany: faceid,
      description: facedesc
    })).done(function(data, err) {
      updateStorage('faces', {})
      success('Организация добавлена')
      $('#facename').val('')
      $('#faceid').val('')
      $('#facedesc').val('')
			setTimeout(function (){
				$('#hrefloading').click()
				setTimeout(function (){
					$('#hreffaces').click()
				},150)
			}, 1500)
    })
  }
}

function addPartner() {
  var name = $('#name').val()
  var id = $('#id').val()
  var email = $('#email').val()
  var phone = $('#phone').val()
  var comment = $('#comment').val()
  var end = $('#end').val()
  var prepayment = $('#prepayment').val()
  var delivery = $('#delivery').val()
  if (name == '') {
    error('Введите название организации')
  }else if (id == '') {
    error('Введите ИНН')
  }else if (email == '') {
    error('Введите емайл')
  }else if (phone == '') {
    error('Введите телефон')
  }else if (comment == '') {
    error('Введите комментарий')
  }else if (end == '') {
    error('Укажите до какого числа действует договор')
  }else if (prepayment == '-') {
    error('Укажите отсрочку платежа')
  }else if (delivery == '-') {
    error('Выберите условие доставки')
  }else{
    apiAdd('partners', JSON.stringify({
      name: name,
      idcompany: id,
      emailpartner: email,
      phone: phone,
      comment: comment,
      endcontract: end,
      prepayment: prepayment,
      delivery: delivery,
    })).done(function(data, err) {
      updateStorage('partners', {})
      success('Партнер добавлен')
      $('#name').val('')
      $('#id').val('')
      $('#email').val('')
      $('#phone').val('')
      $('#comment').val('')
      $('#end').val('')
      $('#prepayment').val('-')
      $('#delivery').val('-')
			setTimeout(function () {
				$('#hrefloading').click()
			}, 1500)
    })
  }
}

function addUser() {
  var name = $('#name').val()
  var position = $('#position').val()
  var email = $('#email').val()
  var phone = $('#phone').val()
  var passw = $('#passw').val()
  var buh = $('#buh').is(':checked')
  var manager = $('#manager').is(':checked')
  var storekeeper = $('#storekeeper').is(':checked')
  if (name == '') {
    error('Введите имя')
  }else if (position == '') {
    error('Введите должность')
  }else if (email == '') {
    error('Введите емайл')
  }else if (phone == '') {
    error('Введите телефон')
  }else if (passw == '') {
    error('Введите пароль')
  }else if (buh == false && manager == false && storekeeper == false) {
    error('Укажите права доступа')
  }else{
    // position, access ?
    apiAdd('users_success', JSON.stringify({
      name               : name,
      user_email         : email,
      phone              : phone,
      passw              : passw,
      avatar             : 'https://www.gravatar.com/avatar/'+$.md5(email)+'?s=200&d=mm',
      position           : position,
      access_buh         : buh,
      access_manager     : manager,
      access_storekeeper : storekeeper,
      company            : $.cookie('email')
    })).done(function(data, err) {
      updateStorage('users_success', {})
      success('Пользователь добавлен')
      $('#name').val('')
      $('#position').val('')
      $('#email').val('')
      $('#phone').val('')
      $('#passw').val('')
			setTimeout(function () {
				$('#hrefloading').click()
			}, 1500)
    })
  }
}

function addInvoice() {
	var sum         = $('#sum').val()
	var face         = $('#company').val()
	var face_name    = $("#company option:selected").text()
	var partner      = $('#partners').val()
	var partner_name = $("#partners option:selected").text()
	var message      = $('#message').val()
	if (face == 'Выбрать из списка') {
    error('err1')
  }else if (partner == 'Выбрать из списка') {
    error('err2')
  }else if (message == '') {
    error('err3')
  }else if (sum == '') {
    error('err4')
  }else{
    apiAdd('invoices', JSON.stringify({
      face         : face,
			partner      : partner,
			message      : message,
			status       : 0,
			company      : $.cookie('email'), // xxxx
			partner_name : partner_name,
			face_name    : face_name,
			file         : ' ',
			date         : Date.now(),
			sum          : sum,
			user_name    : localStorage.getItem('name'),
			user_avatar  : localStorage.getItem('avatar')
    })).done(function(data, err) {
      updateStorage('invoices', {})
      success('success')
			$('#company').val('')
      $('#partners').val('')
			setTimeout(function (){
				$('#hrefloading').click()
			}, 1500)
    })
  }
}

function addFileInvoice() {
	var sum         = $('#sum').val()
	var face         = $('#company').val()
	var face_name    = $("#company option:selected").text()
	var partner      = $('#partners').val()
	var partner_name = $("#partners option:selected").text()
	if (face == 'Выбрать из списка') {
    error('err1')
  }else if (partner == 'Выбрать из списка') {
    error('err2')
  }else if (sum == '') {
    error('err4')
  }else{
    apiAdd('invoices', JSON.stringify({
      face         : face,
			partner      : partner,
			message      : ' ',
			status       : 1,
			company      : $.cookie('email'), // xxxx
			partner_name : partner_name,
			face_name    : face_name,
			file         : 'test',
			date         : Date.now(),
			sum          : sum,
			user_name    : localStorage.getItem('name'),
			user_avatar  : localStorage.getItem('avatar')
    })).done(function(data, err) {
      updateStorage('invoices', {})
      success('success')
			$('#company').val('')
      $('#partners').val('')
			setTimeout(function (){
				$('#hrefloading').click()
			}, 1500)
    })
  }
}
