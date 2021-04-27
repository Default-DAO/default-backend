const AWS = require('aws-sdk');

async function uploadToS3(data) {
    try {
        let contentType = data.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0]   
        
        const clean = data.replace(/^data:image\/[\w+]+;base64,/, "");
        const imageBase64 = new Buffer(clean, 'base64');
        
        let bucketName = process.env.S3_BUCKET
        let randomKey =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        let resourceName = `${id}-${randomKey}`             
    
        const params = {
            Bucket: bucketName,
            Key: resourceName,
            ContentType: contentType,
            ContentEncoding: 'base64',
            Body: imageBase64
        };
        
        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        });
        
        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) return reject(err)
                return resolve(data.Location)
            })
        })
    } catch (err) {
        console.log('Failed upload banner to S3: ', err)
    }
}

module.exports = {uploadToS3}