const axios = require('axios');
const { getToken } = require('../logging_middleware/auth');

/**
 * Stage 6: Priority Inbox Implementation
 * Requirement: Display top 10 most important unread notifications.
 * Priority Logic: 
 * 1. Type Weight: Placement > Result > Event
 * 2. Recency: Newer timestamp first
 */

const NOTIFICATION_API = "http://20.207.122.201/evaluation-service/notifications";

const TYPE_WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

async function getPriorityNotifications(n = 10) {
    try {
        console.log(`--- Fetching Priority Inbox (Top ${n}) ---`);
        
        // 1. Get Authentication Token
        const token = await getToken();
        if (!token) throw new Error("Failed to authenticate with the service.");

        // 2. Fetch Notifications from API
        const response = await axios.get(NOTIFICATION_API, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const allNotifications = response.data.notifications || [];
        console.log(`Total notifications fetched: ${allNotifications.length}`);

        // 3. Apply Sorting Logic
        // Primary: Weight (Placement > Result > Event)
        // Secondary: Timestamp (Descending / Newest first)
        const sortedNotifications = allNotifications.sort((a, b) => {
            const weightA = TYPE_WEIGHTS[a.Type] || 0;
            const weightB = TYPE_WEIGHTS[b.Type] || 0;

            if (weightA !== weightB) {
                return weightB - weightA; // Higher weight first
            }

            // If weights are equal, sort by recency
            return new Date(b.Timestamp) - new Date(a.Timestamp);
        });

        // 4. Extract Top N
        const topNotifications = sortedNotifications.slice(0, n);

        // 5. Output results
        console.log("\n--- TOP 10 PRIORITY NOTIFICATIONS ---");
        topNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. [${notif.Type}] - ${notif.Message}`);
            console.log(`   Time: ${notif.Timestamp} | ID: ${notif.ID}\n`);
        });

        return topNotifications;

    } catch (error) {
        console.error("Error in Priority Inbox execution:");
        console.error(error.response?.data || error.message);
    }
}

// Execute the function
getPriorityNotifications(10);
