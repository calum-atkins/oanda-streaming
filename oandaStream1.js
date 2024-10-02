console.log('start');
// Use dynamic import() for node-fetch
const axios = require('axios');
const readline = require('readline');
const es = require('event-stream');


//const accessToken = '150bbfb3f9a95b56c3f9b98aa82b8b64-1f1914bbc37a22156b8b9c8d49f83c5d';
//const accountNumber = '001-004-6038873-001';
const accessToken = '1f1befaad5d67687ff7e0aa2eb10eac7-d09b57596e582795520209741fc897f8';
const accountNumber = '101-004-23424312-001';
//const url = `https://stream-fxtrade.oanda.com/v3/accounts/${accountNumber}/transactions/stream`;
const url = `https://stream-fxpractice.oanda.com/v3/accounts/${accountNumber}/transactions/stream`;
	
const salesforceEndpoint = `https://atkex-dev-ed.my.salesforce.com/services/apexrest/trade/transaction`;
var sfAccessToken =`00D7Q00000ACiyh!ARcAQE.97fSQ2YUHcVjmziRiY.AhVXq3.oveA1uXchdKTvDwkrpWKS0Mcau_2feG56OeMgM0oDJabi6gQRPl8H88LN4EGk2_`;
//var sfAccessToken =`

const headers = {
    'Authorization': `Bearer ${accessToken}`,
};

var sfHeaders = {
  'Authorization' : `Bearer ${sfAccessToken}`,
};

const tokenAuthEndpoint = 'https://atkex-dev-ed.my.salesforce.com/services/oauth2/token';
const bodyAuth = {
  'grant_type' : `client_credentials`,
  'client_id' : '3MVG9t0sl2P.pByrqLTOp3U_uypT56MigXDbhAhYp89l3xBSM71sVeBrLSToijf5NuYxtSBeyy4AIJJQlnZNH',
  'client_secret' : 'CEB69CFF37BD47FA7EBE7D3FBEE527B95DD017C8FE37FDB5956755B20035DF30'
  //'username' : 'calum2atkins@empathetic-badger-52ng52.com',
  //'password' : '578683945736C@l07l4yLkvHxT1ucLvLy1iCGSj4H',
};

const formData = new URLSearchParams(bodyAuth).toString();

async function startStreaming() {
  try {
	//setupRefreshLoop ();
	await refreshAccessToken();

    //const response = await axios.get(url, { headers, responseType: 'stream' });
    const response = await makeRequestWithRetry(url, { headers, responseType: 'stream' });


    const rl = readline.createInterface({ input: response.data });

    rl.on('line', async (line) => {
      try {
        const transaction = JSON.parse(line);
        
	if (transaction.type !== "HEARTBEAT") {
	 console.log('Recieved New Transcation:', transaction);
         await sendTransactionData(transaction); 

        } else {
	  console.log('HEARTBEAT:', transaction);
	}
	
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });

    rl.on('close', () => {
      console.log('Transaction stream ended.');
    });

    //rl.on('error', (error) => {
    //  console.error('Readline error:', error);
    //  startStreaming(); // Restart streaming on error
    //});

    //response.data.on('error', (error) => {
    //  console.error('Response stream error:', error);
    //  startStreaming(); // Restart streaming on error
    //});
  } catch (error) {
    console.error('Error occurred while streaming transactions:', error);
    startStreaming();
  }
}

async function sendTransactionData(data) {
  try {
	console.log('sendtransaction');
    	await refreshAccessToken();
	const res = axios.post(salesforceEndpoint, data, { headers: sfHeaders });
    	console.log('Data sent to salecome.com:', res.data);
    // Send the transaction data to salecome.com endpoint
    
  } catch (error) {
    throw error;
  }
}

async function refreshAccessToken() {
  try {
	console.log('refreshtoken');
        
    // Perform the logic to refresh the access token (Replace this with your actual logic)
    const headers2 = {
   	 'Content-Type': `application/x-www-form-urlencoded`,
  	}

    const auth = await axios.post(tokenAuthEndpoint, formData, headers2);
//    console.log(auth.data.access_token);
    let aT = auth.data.access_token;
	//let str = aT.slice(0, aT.length - 4);
    //sfAccessToken = str;
    //console.log(str);
	sfHeaders = {
	  'Authorization' : `Bearer ${aT}`,
	};
	console.log(aT);

    // For the purpose of this example, let's assume you get a ne+wAccessToken using your own logic.
    //const newAccessToken = 'NEW_ACCESS_TOKEN';

    // Update the access token in the headers object
    //headers.Authorization = `Bearer ${newAccessToken}`;
    //console.log('Access token refreshed:', newAccessToken);
  } catch (error) {
    throw error;
  }
}

function setupRefreshLoop() {
	refreshAccessToken();
	const intervalMil = 50* 60 * 1000;

	setInterval(refreshAccessToken, intervalMil);
}

async function makeRequestWithRetry(url, config, retryCount = 3) {
  try {
    return await axios.get(url, config);
  } catch (error) {
    if (error.code === 'ECONNRESET' && retryCount > 0) {
      console.error('Connection reset. Retrying request...');
      return await makeRequestWithRetry(url, config, retryCount - 1);
    } else {
      throw error; // Throw the error if retry is not possible or retry count is exhausted
    }
  }
}

function startAndRestartStreaming() {
    console.log('Start streaming...');
    startStreaming(); // Start the streaming process
    const interval = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

    setTimeout(() => {
        console.log('Restarting streaming...');
        startAndRestartStreaming(); // Restart the streaming process after 4 hours
    }, interval);
}

startAndRestartStreaming();
