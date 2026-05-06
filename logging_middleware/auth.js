const axios = require("axios");

let accessToken = "";

async function getToken() {
    try {

        if (accessToken) {
            return accessToken;
        }

        const response = await axios.post(
            "http://20.207.122.201/evaluation-service/auth",
            {
                email: "bhavikarisetty@gmail.com",
                name: "arisetty bhavik",
                rollNo: "AM.SC.U4AIE23023",
                accessCode: "PTBMmQ",
                clientID: "5c499f6c-d053-4090-9481-dfbaa22b57ad",
                clientSecret: "grJSWNzDBzYrHqJr"
            }
        );

        accessToken = response.data.access_token;

        console.log("Token Generated");

        return accessToken;

    } catch (error) {

        console.log("Auth Error");

        console.log(
            error.response?.data || error.message
        );
    }
}

module.exports = { getToken };