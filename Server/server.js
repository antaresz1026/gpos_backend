const express = require('express');
const axios =require('axios');
const https = require('https');
const multer = require('multer');
const redis = require('redis');
const winston = require('winston');
const fs = require('fs');
const spawn = require('child_process').spawn;
const redis_client = redis.createClient();
const app = express();
const port = 21026;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/home/antaresz/GPOS/ImageTempRepo')
    },
    filename: async function (req, file, cb) {
		const data = await redis_client.get(req.body.sessionID);

		if(data) {
			const json_data = JSON.parse(data);
			const userid = json_data.userid;

			cb(null, userid + "_upload_image")
		} else {
			console.log('No data found');
			return res.status(400).send('SessionID is required.');
		}
        
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
app.use('/images', express.static('/home/antaresz/GPOS/MattingScript/output'));
app.use((req, res, next) => {
  logger.info('Log message');
  next();
});
app.post('/GPOS/login', process_login);
app.post('/GPOS/upload', upload.single('upload_image'), process_upload);
app.get('/GPOS/matting', process_matting);
	
https.createServer(https_options, app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

function process_login(req, res) {	
	const query = `https://api.weixin.qq.com/sns/jscode2session?appid=wxdb77935cd0ae3b06&secret=6f2b47067771af8ba3daa3fa270c3520&js_code=${req.body.code}&grant_type=authorization_code`;
	const username = req.body.nickname;

	axios.get(query)
		 .then(response => {
			const sessionID = response.data.session_key;
			
			if(response.data.unionid) {
				const userid = response.data.unionid;
				redis_client.set(sessionID, JSON.stringify({ userid, username}), 'EX', 3600, (err) => console.log('Redis Client set error'));
			} else {
				const userid = response.data.openid;
				redis_client.set(sessionID, JSON.stringify({ userid, username}), 'EX', 3600, (err) => console.log('Redis Client set error'));
			}
			res.status(200).json({ sessionID });
		 })
		 .catch(error => {
			res.send('error');
		 });
	
};

async function process_upload(req, res) {
	const type = req.body.type;
	const sessionid = req.body.sessionID;
	let userid_container;

	try {
		const data = await redis_client.get(sessionid)
		if(data) {
			const json_data = JSON.parse(data);

			userid_container = json_data.userid;
		} else {
			console.log('No data found');
			return res.status(400).send('SessionID is required.');
		}
	} catch(error) {
		console.error(error);
		return res.status(500).send('Error get from redis.');
	}

	if(!userid_container) {
		console.log('You lose your userid');
		return res.status(400).send('SessionID is required.');
	}
	if (!req.file) {
		console.log('No file recevied');
        return res.status(400).send('No file uploaded.');
    }
	res.status(200).send('success');

	const userid = userid_container;
	const image_path = `/home/antaresz/GPOS/MattingScript/input/${userid}/${type}`;
	const file_name = `${userid}_upload_image`;

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

	const scriptPath = "/home/antaresz/GPOS/MattingScript/size_transform.py";
	const args = [
		`${userid}`
	];
	const python_process = spawn('/home/antaresz/anaconda3/envs/Antaresz/bin/python3.8', [scriptPath, ...args]);
};

async function process_matting(req, res) {
	console.log(req.query);
	const sessionid = req.query.sessionID;
	let userid_container;

	console.log(sessionid);
	try {
		const data = await redis_client.get(sessionid)
		if(data) {
			const json_data = JSON.parse(data);

			userid_container = json_data.userid;
		} else {
			console.log('No data found');
			return res.status(400).send('SessionID is required.');
		}
	} catch(error) {
		console.error(error);
		return res.status(500).send('Error get from redis.');
	}
	const userid = userid_container;
	const scriptPath = "/home/antaresz/GPOS/MattingScript/inference_images.py";
	const args = [
		'--model-type', 'mattingbase',
		'--model-backbone', 'resnet101',
		'--model-checkpoint', '/home/antaresz/GPOS/MattingScript/train_model/pytorch_resnet101.pth',
		'--device', 'cpu',
		'--images-bgr', `/home/antaresz/GPOS/MattingScript/input/${userid}/bgr`,
		'--images-src', `/home/antaresz/GPOS/MattingScript/input/${userid}/src`,
		'--output-dir', `/home/antaresz/GPOS/MattingScript/output/${userid}`,
		'--output-type', 'com',
		'-y'
	];
	const python_process = spawn('/home/antaresz/anaconda3/envs/GPOS/bin/python3.8', [scriptPath, ...args]);

    python_process.on('close', (code) => {
        if (code === 0) {
            res.json({ url: `https://antaresz.cc:21026/images/${userid}/com/000.png` });
        } else {
            res.status(500).send('Python script failed with code ' + code);
        }
    });

    python_process.on('error', (err) => {
        res.status(500).send('Failed to start Python script: ' + err.message);
    });
}


