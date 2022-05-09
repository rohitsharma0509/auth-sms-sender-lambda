const AWS = require('aws-sdk');
const b64 = require('base64-js');
const encryptionSdk = require('@aws-crypto/client-node');
const fetch = require('node-fetch');
const convert = require('xml-js');
//Configure the encryption SDK client with the KMS key from the environment variables.  

const { encrypt, decrypt } = encryptionSdk.buildClient(encryptionSdk.CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);
const generatorKeyId = process.env.KEY_ALIAS;
const keyIds = [ process.env.KEY_ID ];
const keyring = new encryptionSdk.KmsKeyringNode({ generatorKeyId, keyIds })
const senderId = process.env.SENDER_ID;
const userName = process.env.USERNAME;
const password = process.env.PASSWORD;
const serviceUrl  = process.env.SMS_SERVICE_URL;

const otpTemplates = [
  "Your authentication code is ",
  "Your OTP is ",
  "Your one time secure code is "
];

exports.handler = async (event) => {

//Decrypt the secret code using encryption SDK.

let plainTextCode;
if(event.request.code){
const { plaintext, messageHeader } = await decrypt(keyring, b64.toByteArray(event.request.code));
plainTextCode = plaintext
}

//PlainTextCode now has the decrypted secret.
console.log('Plaintext code is:'+plainTextCode);

let buff2 = Buffer.from(plainTextCode, "base64");
let code = buff2.toString("ascii");
console.log('Code is:' + code);

let phoneNumber = event.request.userAttributes.phone_number;
console.log('Sending SMS OTP to number:'+phoneNumber);

if(event.triggerSource == 'CustomSMSSender_Authentication'){
  console.log('Invoking api');
  var parsedPh = getPhoneNumber(phoneNumber);
  console.log("Parsed ph:"+parsedPh);
  let smsMessage = getSMSText(code);
  let nType = getNType(phoneNumber);
  var params = {
    sender: senderId, 
    msisdn: parsedPh,
    msg: smsMessage,
    smstype:'sms',
    ntype: nType,
    username: userName,
    password: password

  }

  var url = new URL(serviceUrl);
  var paramStr = new URLSearchParams(params).toString();
  console.log(paramStr)

  var rawResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: paramStr
});
let response = await rawResponse.text();
console.log(response);
//let responseData = convert.xml2json(response);
//console.log('Response from sms service is:'+responseData);

}else{
  console.log('Unknown event:'+event.triggerSource);

}

return;
};

const getSMSText = function(smsCode){
  var randomIndex  = Math.floor((Math.random() * otpTemplates.length));
  return otpTemplates[randomIndex]+` ${smsCode} for rider app login.`
}

const getPhoneNumber = function(phoneNumber){
  if(phoneNumber.includes('+66')){
    return phoneNumber.replace("+660", "")

  }else{
    return phoneNumber.replace("+", "");
  }
}

const getNType = function(phoneNumber){
  if(phoneNumber.includes('+66')){
    return 'in';

  }else{
    return 'out';
  }

}
