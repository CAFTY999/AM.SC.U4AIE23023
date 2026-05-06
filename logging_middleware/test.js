const Log = require("./logger");

async function test() {

    const response = await Log(
        "backend",
        "info",
        "service",
        "Logger working succesfully"
    );

    console.log(response);
}

test();