const http=require('http');
const cors=require('cors');
const fs=require('fs');
const path=require('path');
const express=require('express');
const mysql=require('mysql');
const bodyParser=require('body-parser');
const multer=require('multer');
const app=express();
const port=5555;

const con=mysql.createConnection({
host:'Host',
user:'User',
password:'Password',
database:'Database'
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

con.connect(function(err){
	if(err)
		throw err;
	
	console.log('Connected');
});

fs.readdir('uploads', (e)=>{
	if(e)
		fs.mkdirSync('uploads');
});

const upload=multer({
	storage:multer.diskStorage({
		destination(req, file, clip){
			clip(null, 'uploads/');
		},
		filename(req, file, clip){
			const ext=path.extname(file.originalname);

			clip(null, path.basename(file.originalname, ext)+Date.now()+ext);
		}
	}),
	limits:{filesize:5242880}
}).single("upload");

app.post('/comment1', function(req, res){
	var q=req.body.q;
	var script=req.body.script;
	var comment_id=req.body.comment_id;
	var code=req.body.delete_code;

	var query="insert into comment1(comment, uploader, script, code) values('"+q+"', '"+comment_id+"', "+script+", '"+code+"');";

	con.query(query, function(err, result, fields){
		if(err){
			res.send("1");

			return;
		}
		
		res.send("0");

		return;
	});
});

app.post('/create', function(req, res){
	var ID=req.body.id;
	var PW=req.body.pw;

	var query="select * from login where id='"+ID+"';";

	con.query(query, function(err, result, fields){
		if(result.length!=0){
			res.send("1");

			return;
		}
		else{
			query="insert into login(id, pw) values('"+ID+"', '"+PW+"');";

			con.query(query, function(e, r, f){
				res.send("0");

				return;
			});
		}
	});

	return;
});

app.post('/login', function(req, res){
	var ID=req.body.id;
	var PW=req.body.pw;

	var query="select * from login where id='"+ID+"';";

	con.query(query, function(err, result, fields){
		if(result.length>0){
			if(result[0].pw==PW)
				res.send("0");
			else
				res.send("1");
		}
		else{
			res.send("2");
		}
	});
});

app.post('/script', function(req, res){
	var Title=req.body.title;
	var Inner=req.body.inner;
	var ID=req.body.id;
	var Code=req.body.code;
	var imgName=req.body.imgName;

	var query="insert into script(title, inner_text, uploader, code, img) values('"+Title+"', '"+Inner+"', '"+ID+"', '"+Code+"', '"+imgName+"');";

	con.query(query, function(err, result, fields){
		if(err){
			res.send("1");

			return;
		}
		else{
			res.send("0");
		}
	});
});

app.post('/delete_comment1', function(req, res){
	var query="delete from comment1 where id="+req.body.id+" and code='"+req.body.code+"';";

	con.query(query, function(err, result, fields){
		if(err || result.affectedRows==0){
			res.send("1");

			return;
		}

		res.send("0");

		return;
	});
});

app.post('/delete_page', function(req, res){
	var query="delete from script where id="+req.body.id+" and code='"+req.body.code+"';";

	con.query(query, function(err, result, fields){
		if(err || result.affectedRows==0){
			res.send("1");

			return;
		}
		else{
			query="delete from comment1 where script="+req.body.id+";";

			con.query(query, function(e, r, f){
				if(e){
					res.send("1");

					return;
				}
				else{
					res.send("0");

					return;
				}
			});
		}
	});
});

app.post('/page', function(req, res){
	var ID=req.body.id;
	var list={
		comment:[]
	};

	var query="select title, img, inner_text, uploader from script where id='"+ID+"';";

	con.query(query, function(err, result, fields){
		if(err){
			res.send("1");

			return;
		}
		else{
			list.page=result[0];
		}
	});

	query="select date_format(time_stamp, '%Y년 %m월 %d일 %H시 %i분') as time_stamp, uploader, comment, id from comment1 where script="+ID+";";

	con.query(query, function(err, result, fields){
		if(err){
			res.send("1");

			return;
		}

		for(var i=0; i<result.length; i++){
			list.comment[i]=result[i];
		}

		res.json(list);

		return;
	});
});

app.post('/q', function(req, res){
	var q=req.body.query;
	var list={};

	var query="select title, date_format(time_stamp, '%Y년 %m월 %d일 %H시 %i분') as time_stamp, uploader, id from script where title like '%"+q+"%' or inner_text like '%"+q+"%' or uploader like '%"+q+"%' order by time_stamp desc;";

	con.query(query, function(err, result, fields){
		if(err){
			res.send("1");

			return;
		}

		list=result;
		res.json(list);

		return;

	});
});

app.post('/list', function(req, res){
	var Page=req.body.page;
	var list={};

	var query="select title, date_format(time_stamp, '%Y년 %m월 %d일 %H시 %i분') as time_stam, uploader, id from script order by time_stamp desc;";

	con.query(query, function(err, result, fields){
		if(err){
			res.send("1");

			return;
		}

		if(result.length>10*Page){
			for(var i=10*Page-10; i<10*Page; i++){
				list[i]=result[i];
			}
		}
		else if(result.length>10*Page-10){
			for(var i=10*Page-10; i<result.length; i++){
				list[i]=result[i];
			}
		}
		else{
			res.send("1");

			return;
		}

		res.json(list);

		return;
	});
});

app.post('/upload', function(req, res, next){
	upload(req, res, (err)=>{
		if(err){
			res.send("1");

			return;
		}

		res.send(res.req.file.filename);

		return;
	});
});

app.use(express.static('uploads'));

app.listen(port, ()=>console.log('yup'));
