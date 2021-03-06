var registerNewClient = "register_new_client";
var unregisterClient = "unregister_client";

var registrationToken = '';

/**
 * Sets the status of the app to the passed text.
 */
function setStatus(text) {
  document.getElementById('status').value = text;
}

/**
 * Sets the status of the app server.
 */
function setAppServerStatus(text) {
  document.getElementById('appServerStatus').value = text;
}

/**
 * Handles the case when the client is already registered.
 */
function handleAlreadyRegistered() {
  chrome.storage.local.get('regToken', function(result) {
    registrationToken = result['regToken'];
    setStatus('Already registered. Registration token:\n' + registrationToken);
    document.getElementById('register').disabled = true;
    document.getElementById('unregister').disabled = false;
  });
}

/**
 * Disable the buttons to prevent multiple clicks.
 */
function disableButtons() {
  document.getElementById('register').disabled = true;
  document.getElementById('unregister').disabled = true;
}

/**
 * Call cb with `true` if the client is registered, false otherwise.
 */
function isRegistered(cb) {
  chrome.storage.local.get('registered', function(result) {
    cb(result['registered']);
  });
}

/**
 * Returns a message payload sent using GCM.
 */
function buildMessagePayload(data) {
  return {
    // This is not generating strong unique IDs, which is what you probably
    // want in a production application.
    messageId: new Date().getTime().toString(),
    destinationId: document.getElementById('senderId').value + '@gcm.googleapis.com',
    data: data
  };
}

/**
 * Register a GCM registration token with the app server.
 */
function registerWithAppServer(regToken, cb) {
  var stringIdentifier = document.getElementById('stringIdentifier').value || "";

  var data = {
    action: registerNewClient,
    registration_token: regToken
  };
  if (stringIdentifier) data.stringIdentifier = stringIdentifier;

  var message = buildMessagePayload(data);

  chrome.gcm.send(message, function(messageId) {
    if (chrome.runtime.lastError) {
      cb(false, chrome.runtime.lastError);
    } else {
      cb(true);
    }
  });
}

/**
 * Unregister a registration token from the app server.
 */
function unregisterFromAppServer(cb) {
  var message = buildMessagePayload({
      action: unregisterClient,
      registration_token: registrationToken
    });

  chrome.gcm.send(message, function(messageId) {
    if (chrome.runtime.lastError) {
      cb(false, chrome.runtime.lastError);
    } else {
      cb(true);
    }
  });
}

/**
 * Calls the GCM API to register this client if not already registered.
 */
function register() {
  isRegistered(function(registered) {
    // If already registered, bail out.
    if (registered) return handleAlreadyRegistered();

    var senderId = document.getElementById('senderId').value;
    if (!senderId) {
      return setStatus('Please provide a valid sender ID.');
    }
    chrome.gcm.register([senderId], registerCallback);
    setStatus('Registering...');
    disableButtons();
  });
}

/**
 * Calls the GCM API to unregister this client.
 */
function unregister() {
  chrome.gcm.unregister(unregisterCallback);
  setStatus('Unregistering...');
  disableButtons();
}

/**
 * Called when GCM server responds to a registration request.
 */
function registerCallback(regToken) {
  if (chrome.runtime.lastError) {
    // Registration failed, handle the error and retry later.
    document.getElementById('register').disabled = false;
    return setStatus('FAILED: ' + chrome.runtime.lastError.message);
  }

  setStatus('Registration SUCCESSFUL. Registration ID:\n' + regToken);

  registrationToken = regToken;

  saveToFirebase(regToken);

  // Notify the app server about this new registration
  registerWithAppServer(registrationToken, function(succeed, err) {
    if (succeed) {
      setAppServerStatus('Registration with app server SUCCESSFUL.');
      chrome.storage.local.set({ registered: true });
      chrome.storage.local.set({ regToken: registrationToken });
      document.getElementById('register').disabled = true;
      document.getElementById('unregister').disabled = false;
    } else {
      setAppServerStatus('Registration with app server FAILED: ' + err);
      document.getElementById('register').disabled = false;
    }
  });
}


function saveToFirebase(regToken){
  var myFirebaseRef = new Firebase("https://domtcnotifications.firebaseio.com/");
  myFirebaseRef.set({
    title: "Hello World!",
    author: "Firebase",
    token: regToken,
    location: {
      city: "San Francisco",
      state: "California",
      zip: 94103
    }
  });
}

/**
 * Called when GCM server responds to an unregistration request.
 */
function unregisterCallback() {
  document.getElementById('register').disabled = false;
  document.getElementById('unregister').disabled = true;

  if (chrome.runtime.lastError) {
    return setStatus('FAILED: ' + chrome.runtime.lastError.message);
  }

  setStatus('Unregistration SUCCESSFUL');
  chrome.storage.local.remove([ 'registered', 'regToken' ]);

  // Notify the app server about this unregistration
  unregisterFromAppServer(function(succeed, err) {
    if (succeed) {
      setAppServerStatus('Unregistration with the app server SUCCESSFUL.');
      registrationToken = '';
    } else {
      setAppServerStatus('Unregistration with app server FAILED: ' + err);
    }
  });
}


window.onload = function() {
  document.getElementById('register').onclick = register;
  document.getElementById('unregister').onclick = unregister;

  chrome.gcm.onMessage.addListener(function(message) {
    console.log('chrome.gcm.onMessage', message);
    //document.getElementById('message').value = JSON.stringify(message);

    var options =   {
      type: "basic",
      title: "chrome.gcm.onMessage",
      message: JSON.stringify(message),
      iconUrl: "icon.png",
      priority: 2
    };
    var creationCallback = function(){};
    chrome.notifications.create(null, options, creationCallback);
  });

  isRegistered(function(registered) {
    if (registered) {
      handleAlreadyRegistered();
    } else {
      setStatus('Put your sender ID above and click Register.');
      document.getElementById('register').disabled = false;
      document.getElementById('unregister').disabled = true;
    }
  });

};
