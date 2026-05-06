const axios = require("axios");

const { getToken } = require("./auth");

const LOG_API = "http://20.207.122.201/evaluation-service/logs";

const validStacks = ["backend", "frontend"];

const validLevels = [
    "debug",
    "info",
    "warn",
    "error",
    "fatal"
];

const validPackages = [
    "cache",
    "controller",
    "cron_job",
    "db",
    "domain",
    "handler",
    "repository",
    "route",
    "service",
    "api",
    "component",
    "hook",
    "page",
    "state",
    "style",
    "auth",
    "config",
    "middleware",
    "utils"
];

async function Log(stack, level, pkg, message) {

    try {

        stack = stack.toLowerCase();
        level = level.toLowerCase();
        pkg = pkg.toLowerCase();

        if (!validStacks.includes(stack)) {
            throw new Error("Invalid stack value");
        }

        if (!validLevels.includes(level)) {
            throw new Error("Invalid level value");
        }

        if (!validPackages.includes(pkg)) {
            throw new Error("Invalid package value");
        }

        if (!message || typeof message !== "string") {
            throw new Error("Message must be a string");
        }

        const token = await getToken();

        const response = await axios.post(
            LOG_API,
            {
                stack,
                level,
                package: pkg,
                message
            },
            {
                headers: {
                    Authorization: 'Bearer ${token}'
                }
            }
        );

        console.log("Log Created");

        return response.data;

    } catch (err) {

        console.error(
            "Logging failed:",
            err.response?.data || err.message
        );
    }
}

module.exports = Log;