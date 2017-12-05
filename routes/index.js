var crypto = require('crypto'),//crypto 是 Node.js 的一个核心模块，我们用它生成散列值来加密密码。
    User = require('../models/user.js'),
    Post = require('../models/post.js');

module.exports = function(app){
	//主页
	app.get('/',function(req,res){
		Post.get(null,function(err,posts){
			if(err){
				posts = [];
			}
			res.render('index',{
			title:'主页',
			user:req.session.user,
			posts:posts,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
			});
		});
	});
	//登陆
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
		res.render('login',{
			title:'登陆',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var name = req.body.name;
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		//先找到有没有这个用户 没有的话直接返回，有的话就检测密码
		User.get(name,function(err,user){
			if(err){
				req.flash('error','用户不存在');
				res.redirect('/login');
			}
			//如果存在用户就判断密码是否一致
			if(user.password != password){
				req.flash('error','密码错误');
				res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success','登陆成功');
			res.redirect('/');	
		})
	});
	//注册
	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render('reg',{
			title:'注册',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		var name = req.body.name;
		var password = req.body.password;
		var password_re = req.body['password-repeat'];
		//检测两次密码是否一致
		if(password_re != password){
			req.flash('error','两次密码输入不一致');
			return res.redirect('/reg');//返回注册页
		}	
		//生成密码的MD5的值
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name:name,
			password:password,
			email:req.body.email
		});
		//检测用户名是否存在
		User.get(newUser.name,function(err,user){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			if(user){
				req.flash('error','用户已经存在！');
				return res.redirect('/reg');//返回注册页
			}
			//如果不存在则新增用户
			newUser.save(function(err,user){
				if(err){
					req.flash('error',err);
					return res.redirect('/reg');//注册失败返回注册页
				}
				req.session.user = user;//用户信息存入 session
				req.flash('success','注册成功');
				res.redirect('/');//注册成功返回主页
			});
		});
	});
	//发表文章
	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render('post',{
			title:'发表文章',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	});
	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUsr = req.session.user;
		var post = new Post(currentUsr.name,req.body.title,req.body.post);
		console.log(post);
		post.save(function(err){
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}
			req.flash('success','发布成功');
			res.redirect('/');//发布成功跳转主页
		});
	});
	//登出
	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','登出成功');
		res.redirect('/');
	});

	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','未登录');
			res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','已登录');
			res.redirect('back');
		}
		next();
	}
}