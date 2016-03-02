node server.js

GET: localhost:8484/index.html

get regToken from the console and use it to post to gcm

POST https://gcm-http.googleapis.com/gcm/send
headers:
Authorization:key=AIzaXXXXXXXXXXXXXXXXXXX
Content-Type:application/json

{
  "to" : "dv0RO8efCmk:APA91bFDZiNKp5r5FC68B7Y_EMUM-CakAKnxXXXXXXXXXXXXXXXXXXXXXXXX",
  "data" : {
    "message": "a message"
  }
}


response should be:

{
    "multicast_id": 45445,
    "success": 1,
    "failure": 0,
    "canonical_ids": 0,
    "results": [
        {
            "message_id": "12353"
        }
    ]
}
