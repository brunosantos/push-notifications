Load unpacked extension
click on the extension button
[update senderId ProjectId]
Subscribe

copy regtoken from "GCM Registration Status".


POST https://gcm-http.googleapis.com/gcm/send
headers:
Authorization:key=AIzaXXXXXXXXXXXXXXXXXXX
Content-Type:application/json

{
  "to" : "dv1237598237592 your regtoken",
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
