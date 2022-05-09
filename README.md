# createauthchallenge-lambda

This lambda is responsible for sending OTP sms using custom sms service provider after cognito signin

## Dependent components
1. KMS
2. SMS service

## Environment variables required
```
export SENDER_ID=registered sender id
export USERNAME= username of sms service
export PASSWORD= password of sms service
export SMS_SERVICE_URL= sms service api url
export KEY_ALIAS= kms key alias
export KEY_ID= kms key arn
```
