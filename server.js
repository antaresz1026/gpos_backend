const express = require('express');
const axios =require('axios');
const https = require('https');
const multer = require('multer');
const redis = require('redis');
const winston = require('winston');
const path = require('path');
const session = require('express-session');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { exec } =require('child_process');
const spawn = require('child_process').spawn;
const redis_client = redis.createClient();
const app = express();
const port = 21026;

//图片储存配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/home/antaresz/GPOS/ImageTempRepo')
    },
    filename: function (req, file, cb) {
        cb(null, "tmp" + "_" + Data.now() + "_" + file.fieldname)
    }
});

const upload = multer({ storage: storage });

//SSL证书路径
const https_options = {
	key: fs.readFileSync('/etc/nginx/cert/antaresz.cc.key'),
	cert: fs.readFileSync('/etc/nginx/cert/antaresz.cc_bundle.crt')
};

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
	],
});

redis_client.on('error', (err) => console.log('Redis Client Error', err));
redis_client.connect();
app.use(express.json());
app.use('/images', express.static('/home/antaresz/GPOS/output'));
app.use((req, res, next) => {
  logger.info('Log message');
  next();
});
app.post('/GPOS/login', process_login);
app.post('/GPOS/upload', upload.single('upload_img'), process_upload);
app.get('/GPOS/matting', process_matting);
	
https.createServer(https_options, app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

async function process_upload(req, res) {
	const type = req.body.type;
	const sessionid = req.body.sessionID;
	let userid;
	let step;
	const username = 'test';

	try {
		const data = await redis_client.get(sessionid)
		if(data) {
			const json_data = JSON.parse(data);
			userid = json_data.userid;
			step = json_data.step;
			console.log(step);
		} else {
			console.log('No data found');
			return res.status(400).send('SessionID is required.');
		}
	} catch(error) {
		console.error(error);
		return res.status(500).send('Error get from redis.');
	}
	if(!userid) {
		console.log('You lose your userid');
		return res.status(400).send('SessionID is required.');
	}

	if (!req.file) {
		console.log('No file recevied');
        return res.status(400).send('No file uploaded.');
    }
	
	const image_path = `/home/antaresz/GPOS/input/${username}/${type}`;
	const file_name = `${username}_${type}_upload_img`;

	await fs.mkdir(image_path, { recursive: true }, (err) => {
		if (err) {
			console.error(`Fail to mkdir: ${err}`);
			return res.status(500).send(`Error creating directory: ${err.message}`);
		}
		
		fs.copyFile(`/home/antaresz/GPOS/ImageTempRepo/${file_name}`, `${image_path}/000.jpg`, (copyErr) => {
			if (copyErr) {
				console.error(`Fail to copy: ${copyErr}`);
			} else {
				fs.unlink(`/home/antaresz/GPOS/ImageTempRepo/${file_name}`, (unlinkErr) => {
					if (unlinkErr) {
						console.error(`Fail to delete original file: ${unlinkErr}`);
					} else {
						console.log('Success to mv file');
					}
				});
			}
		});
    });
	
	step += 1;
    //const command = `./home/antaresz/GPOS/build/sql_update --user_id "${userid}" --image_type "${type}" --image_path "${image_path}/${file_name}"`;

	if(step == 1) {
		redis_client.set(sessionid, JSON.stringify({ userid, username: 'test', step }), 'EX', 3600, (err) => console.log('Redis Client set error'));
		console.log(`Step:${step}, openid:${userid}, client_status:${step}`);
		return res.send('File uploaded');
	} else if(step == 2) {
		const scriptPath = "/home/antaresz/GPOS/inference_images.py";
		const args = [
			'--model-type', 'mattingbase',
			'--model-backbone', 'resnet101',
			'--model-checkpoint', '/home/antaresz/GPOS/train_model/epoch-0-iter-24999.pth',
			'--device', 'cpu',
			'--images-bgr', `/home/antaresz/GPOS/input/${username}/bgr`,
			'--images-src', `/home/antaresz/GPOS/input/${username}/src`,
			'--output-dir', `/home/antaresz/GPOS/output/${username}`,
			'--output-type', 'com',
			'-y'
		];

		const python_process = spawn('/home/antaresz/anaconda3/envs/Antaresz/bin/python3.8', [scriptPath, ...args]);

		python_process.stdin.write('y\\n');
		python_process.stdin.end();

		python_process.stdout.on('data', (data) => {
			console.log(`stdout: ${data}`);
		});

		// 处理脚本的 stderr
		python_process.stderr.on('data', (data) => {
			console.error(`stderr: ${data}`);
		});

		// 处理脚本退出
		python_process.on('close', (code) => {
			console.log(`子进程退出，退出码 ${code}`);
			res.send('Matting success for client ' + userid);
		});
	}
};

function process_login(req, res) {	
	const query = `https://api.weixin.qq.com/sns/jscode2session?appid=wxdb77935cd0ae3b06&secret=6f2b47067771af8ba3daa3fa270c3520&js_code=${req.body.code}&grant_type=authorization_code`;
	
	axios.get(query)
		 .then(response => {
			const sessionID = response.data.session_key;
			
			if(response.data.unionid) {
				const userid = response.data.unionid;
				redis_client.set(sessionID, JSON.stringify({ userid, username: 'test'}), 'EX', 3600, (err) => console.log('Redis Client set error'));
			} else {
				const userid = response.data.openid;
				redis_client.set(sessionID, JSON.stringify({ userid, username: 'test'}), 'EX', 3600, (err) => console.log('Redis Client set error'));
			}
			
			res.status(200).json({ sessionID });
		 })
		 .catch(error => {
			res.send('error');
		 });
};

async function process_matting(req, res) {
	const sessionid = req.query.sessionid;
	
	try{
		const data = await redis_client.get(sessionid)
		if(data) {
			const json_data = JSON.parse(data);
			username = json_data.username;
			res.send(`https://antaresz.cc:21026/images/${username}/com/000.png`);
		} else {
			res.status(200).send('wrong sessionID');
		}
	} catch(error) {
		console.error(error);
		res.status(500).send('Some error occurs on server.');
	}
};


