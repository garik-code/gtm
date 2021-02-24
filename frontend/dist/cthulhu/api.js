function apiAuth(phone, passw) {
	var d = $.Deferred()
	data = new FormData()
	data.append('phone', phone)
	data.append('passw', passw)
	$.ajax({
		url: 'http://localhost:228/auth',
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function (data) {
			d.resolve(data)
		},
		error: function (data) {
			d.reject(data)
			console.log('error request')
		}
	});
	return d.promise()
}

function apiGet(name, json) {
	var d = $.Deferred();
	var access_token = $.cookie('access_token')
	var email = $.cookie('email')
	data = new FormData()
	data.append('access_token', access_token)
	data.append('email', email)
	data.append('name', name)
	data.append('data', json)
	$.ajax({
		url: 'http://localhost:228/get',
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function (data) {
			d.resolve(data)
		},
		error: function (data) {
			d.reject(data)
			console.log('error request')
		}
	});
	return d.promise()
}

function apiAdd(name, json) {
	var d = $.Deferred();
	var access_token = $.cookie('access_token')
	var email = $.cookie('email')

	var data = new FormData()
	data.append('access_token', access_token)
	data.append('email', email)
	data.append('name', name)
	data.append('data', json)
  console.log(json);
	$.ajax({
		url: 'http://localhost:228/add',
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function (data) {
			d.resolve(data)
		},
		error: function (data) {
			d.reject(data)
			console.log('error request')
		}
	});
	return d.promise()
}

function apiDelete(name, json) {
	var d = $.Deferred();
	var access_token = $.cookie('access_token')
	var email = $.cookie('email')

	var data = new FormData()
	data.append('access_token', access_token)
	data.append('email', email)
	data.append('type', name)
	data.append('where', json)
  console.log(json);
	$.ajax({
		url: 'http://localhost:228/delete',
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function (data) {
			d.resolve(data)
		},
		error: function (data) {
			d.reject(data)
			console.log('error request')
		}
	});
	return d.promise()
}

function apiSecurity() {
	var d = $.Deferred();
	var access_token = $.cookie('access_token')
	var email = $.cookie('email')

	var data = new FormData()
	data.append('access_token', access_token)
	data.append('email', email)
	$.ajax({
		url: 'http://localhost:228/security',
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function (data) {
			d.resolve(data)
		},
		error: function (data) {
			d.reject(data)
			console.log('error request')
		}
	});
	return d.promise()
}

function apiStatus(type, id) {
		var d = $.Deferred();
		var access_token = $.cookie('access_token');
		var email = $.cookie('email');
		var data = new FormData()
		data.append('access_token', access_token);
		data.append('email', email);
		data.append('type', type);
		data.append('id', id);
		$.ajax({
			url: 'http://localhost:228/status',
			data: data,
			processData: false,
			contentType: false,
			type: 'POST',
			success: function (data) {
				d.resolve(data);
			},
			error: function (data) {
				d.reject(data);
				console.log('error request');
			}
		});
		return d.promise()
}
