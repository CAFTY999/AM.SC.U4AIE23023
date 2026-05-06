# Stage 1

## Notification System Design

### 1. Overview
The notification system is designed to deliver all types of notifications to users across multiple communication channels in real-time. The platform ensures seamless delivery, filtering, and categorization of notifications ranging from critical security alerts to social updates and promotional content.

**Key Delivery Channels:**
*   **In-app notifications**: Displayed directly within the user interface.
*   **Push notifications**: Sent to mobile or desktop devices.
*   **SMS**: Mobile text-based alerts.
*   **Email**: Traditional electronic mail updates.

**Core Capabilities:**
*   **Notification creation & fetching**: Robust lifecycle management.
*   **Real-time delivery**: Instant updates via SSE.
*   **Advanced Filtering**: Filter by category, source, or read status.
*   **Priority-based delivery**: Intelligent sorting and handling.
*   **Observability**: Full integration with the reusable **Logging Middleware** for debugging and monitoring.

---

### 2. Design Specifications

#### A. Notification Categories
| Type | Description |
| :--- | :--- |
| **reminder** | Event reminders and schedules |
| **otp** | Verification and authentication OTPs |
| **promotion** | Marketing and promotional notifications |
| **personal** | Personal user-to-user notifications |
| **social** | Social activity updates |
| **update** | Score updates and application updates |
| **security** | Security alerts and suspicious activities |
| **spam** | Filtered low-priority notifications |

#### B. Notification Priority Levels
| Priority | Description |
| :--- | :--- |
| **low** | Promotional notifications |
| **medium** | General reminders and updates |
| **high** | OTPs and important alerts |
| **critical** | Security and emergency notifications |

#### C. Supported Notification Channels
| Channel | Description |
| :--- | :--- |
| **in-app** | Notifications displayed inside application |
| **push** | Push notifications to devices |
| **sms** | Mobile text notifications |
| **email** | Email-based notifications |

---

### 3. Core Actions Supported
*   **Fetch Notifications**: Retrieve a list of notifications with filtering and pagination.
*   **Unread Count**: Get a quick summary of pending notifications.
*   **Mark as Read/Unread**: Update the status of individual or multiple notifications.
*   **Delete Notification**: Permanently remove a notification.
*   **Real-time Streaming**: Receive instant updates via Server-Sent Events (SSE).

### 4. REST API Endpoints

#### A. Fetch Notifications
*   **Endpoint**: `GET /api/notifications`
*   **Description**: Retrieves a list of notifications with filtering and pagination.
*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Request (Query Params)**:
    *   `category`: String (e.g., `urgent`, `social`)
    *   `is_read`: Boolean
    *   `limit`: Integer (Default: 20)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        { "id": "1", "title": "Welcome", "message": "Thanks for joining!", "is_read": false }
      ],
      "total": 1
    }
    ```

#### B. Create Notification (System/Internal)
*   **Endpoint**: `POST /api/notifications`
*   **Description**: Creates a new notification.
*   **Headers**:
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <token>`
*   **Request (Body)**:
    ```json
    {
      "category": "social",
      "priority": "medium",
      "channel": "in-app",
      "title": "New Like",
      "message": "Raj liked your photo"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "success": true,
      "id": "notif_101",
      "message": "Notification created successfully"
    }
    ```

#### C. Get Unread Count
*   **Endpoint**: `GET /api/notifications/unread-count`
*   **Description**: Returns the count of notifications not yet read.
*   **Headers**:
    *   `Authorization: Bearer <token>`
*   **Request**: None
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "unread_count": 5
    }
    ```

#### D. Mark as Read
*   **Endpoint**: `PATCH /api/notifications/:id/read`
*   **Description**: Updates a notification status to "read".
*   **Headers**:
    *   `Authorization: Bearer <token>`
*   **Request**: None (ID in URL)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Status updated"
    }
    ```

#### E. Delete Notification
*   **Endpoint**: `DELETE /api/notifications/:id`
*   **Description**: Removes a notification.
*   **Headers**:
    *   `Authorization: Bearer <token>`
*   **Request**: None (ID in URL)
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Deleted successfully"
    }
    ```

### 5. Real-time Notification Mechanism
The system will use **Server-Sent Events (SSE)** for real-time delivery.
*   **Endpoint**: `GET /api/notifications/stream`
*   **Headers**: `Accept: text/event-stream`
*   **Mechanism**: The server maintains an open connection and pushes new notifications as they occur. SSE is preferred over WebSockets for this use case as it is unidirectional (Server to Client), lightweight, and supports automatic reconnection.

### 6. Data Schema (JSON)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique UUID for the notification. |
| `category` | Enum | `urgent`, `social`, `promotions`, `updates`, `spam`, `personal`. |
| `source` | String | Originating app (e.g., "WhatsApp", "Instagram", "OTP_Service"). |
| `priority` | String | `critical`, `high`, `normal`, `low`. |
| `title` | String | Short headline for the notification. |
| `message` | String | Detailed content/body. |
| `is_read` | Boolean | Status flag. |
| `metadata` | Object | Flexible key-value pairs for source-specific data (e.g., `sender_id`, `score`). |
| `actions` | Array | List of interactive buttons/links (e.g., "Copy OTP", "View Score"). |

### 7. Logging Strategy
All API interactions and real-time events **MUST** be logged using the `Logging_Middleware`.
*   **Requests**: Log method, endpoint, and user context.
*   **Streaming**: Log when a client connects/disconnects to the SSE stream.
*   **Lifecycle**: Log when a notification is created, read, or deleted.
*   **Example**: `[INFO] [2024-05-06T15:20:00Z] GET /api/notifications - User: Authorized - Status: 200`

---
# Stage 2

## 1. Database Choice: MongoDB (NoSQL)
For a notification system, MongoDB will be my choice as it can support data in any format

### Rationale:
*   **Schema Flexibility**: Notifications come from various sources (WhatsApp, Insta, OTPs) with different metadata. A document-oriented DB allows us to store these without rigid migrations.
*   **High Write Throughput**: Notification systems are write-heavy (bursts of alerts). MongoDB is optimized for high-speed inserts.
*   **Horizontal Scalability**: As the user base grows, MongoDB's sharding capabilities allow us to distribute data across multiple servers easily.

---

## 2. Database Schema
We will use a `notifications` collection with the following structure:

```javascript
{
  "_id": ObjectId("..."),
  "user_id": "user_1",          // Indexed: Crucial for fetching user-specific alerts
  "category": "urgent",           // Indexed: For filtering (reminder, otp, social, etc.)
  "priority": "high",             // (critical, high, medium, low)
  "channel": "push",              // (in-app, push, sms, email)
  "title": "Security Alert",
  "message": "New login detected from Mumbai.",
  "is_read": false,               // Indexed: To quickly count unread notifications
  "created_at": ISODate("..."),   // Indexed: For sorting by most recent
  "metadata": {                   // Flexible object for source-specific data
    "device_id": "IPHONE_15",
    "location": "Mumbai, IN"
  }
}
```

---

## 3. Scalability: Problems and Solutions

### Potential Problems at Scale:
1.  **Massive Data Volume**: Millions of notifications generated daily can lead to slow queries and high storage costs.
2.  **Read Latency**: As the `notifications` collection grows into billions of records, simple `count` and `find` operations will slow down.
3.  **Write Bursts**: Sudden spikes (e.g., a "Flash Sale" promotion) can overwhelm the database.

### Proposed Solutions:
1.  **TTL (Time To Live) Indexes**: Implement a TTL index on the `created_at` field (e.g., 30 days). This automatically deletes old notifications, keeping the database "lean" and performant.
2.  **Indexing Strategy**: Create compound indexes like `{ user_id: 1, is_read: 1, created_at: -1 }` to ensure the "Fetch Unread" query is lightning fast.
3.  **Database Sharding**: Use `user_id` as a shard key to distribute notifications across a cluster of servers.

---

## 4. Sample Queries (NoSQL)

#### A. Fetching Latest Notifications
```javascript
db.notifications.find({ 
    user_id: "user_789", 
    is_read: false 
})
.sort({ created_at: -1 })
.limit(20);
```

#### B. Getting Unread Count
```javascript
db.notifications.countDocuments({ 
    user_id: "user_789", 
    is_read: false 
});
```

#### C. Marking All as Read
```javascript
db.notifications.updateMany(
    { user_id: "user_789", is_read: false },
    { $set: { is_read: true, updated_at: new Date() } }
);
```

#### D. Deleting Old Notifications (Manual fallback to TTL)
```javascript
db.notifications.deleteMany({ 
    created_at: { $lt: new Date(Date.now() - 30*24*60*60*1000) } 
});
```

---

# Stage 3: Query Optimization Analysis

### 1. Analysis of the Query

Yes, it will correctly fetch the data. However, it is extremely slow for a table with 5 million rows. Here is why:

* We are fetching every single column (including potentially long message strings or metadata) even if the UI only needs the title and date. This puts a massive load on Disk I/O and memory.
* If we only have an index on `studentID`, the database still has to manually scan through all notifications for that student to check `isRead = false`, and then perform an expensive Filesort in memory to order them by `createdAt`.
*Computation Cost: Without a specific index covering all three fields, the CPU has to work overtime to sort thousands of rows for a single user request.

### 2. The "Index Every Column" Advice
Another developer suggested adding indexes on every column. This is bad advice.
*Every time a new notification is created, the database would have to update every single index. This would make the system crawl during high-traffic periods.
*5 million rows with 10+ indexes would consume a massive amount of disk space unnecessarily.
*Too many indexes can actually confuse the database engine's optimizer, leading it to pick a less efficient path.

### 3. My Solution
I would implement a Compound Index on `(studentID, isRead, createdAt)`. This allows the DB to find the user, filter by read status, and retrieve the rows in the correct order instantly.

```sql
SELECT id, title, message, createdAt 
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```
---

### 4. Placement Notification Query (Last 7 Days)

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL 7 DAY;
```
*Note: Using `DISTINCT` ensures we don't get duplicate student IDs if a student received multiple placement alerts.*

---

# Stage 4: Scaling and Performance

### The Problem
Fetching notifications from the database on every single page load for 50,000 students is overwhelming the database. This causes high latency and a poor user experience because the DB is hitting its connection and I/O limits.

### Proposed Solutions and Tradeoffs

*   **Redis Caching**
    *   Store the unread count and latest notifications in memory.
    *   Improves speed significantly by avoiding disk reads.
    *   Tradeoff: Cache needs to be updated every time a notification status changes.

*   **Database Read Replicas**
    *   Distribute fetch queries across multiple read-only database copies.
    *   Offloads the main database for writing new notifications.
    *   Tradeoff: Potential replication lag where data is slightly out of sync.

---


# Stage 5: Mass Notifications (Notify All)

### 1. Shortcomings of the Existing Implementation
The provided pseudocode uses a synchronous `for` loop to send 50,000 notifications. This approach has critical flaws:
* Timeouts: An HTTP request cannot stay open for hours. The connection will close long before the 50,000th student is reached.
*Rate Limiting: Sending 50,000 emails in a tight loop will likely cause the email provider to block our IP or trigger rate limits.
*Main Thread Blocking: The server will be unresponsive to other users while this loop is running.
*Lack of Fault Tolerance: If the process crashes at the 10,000th student, there is no easy way to resume without duplicate notifications or missing people.

### 2. Handling Failures (The 200 Failed Students)
If the `send_email` call fails midway for 200 students:
*We don't have a mechanism to track which specific students failed to recieve the notification the only thing we can do it to manually parse the logs and find the students.
*We need Retry Logic. By moving each notification to a "Job Queue," we can automatically retry failed tasks up to 3 times with "Exponential Backoff" (waiting longer between each try).

### 3. Redesign for Reliability and Speed
To make this reliable and fast, I would redesign the system using an Asynchronous Worker Architecture:
1.Producer: The HR request only adds 50,000 tasks to a Message Queue (like Redis) and returns Success immediately.
2Consumers (Workers): Multiple background workers pick up tasks from the queue and process them in parallel.
3.Separation of Concerns: Saving to the DB and sending the email should be separate steps within the job or separate jobs entirely.
    *DB operations are local and fast; email operations are external and slow. A failure in the email API shouldn't prevent the notification from being saved in the user's dashboard.

### 4. Revised Pseudocode (Asynchronous Approach)

```javascript
// 1. The Main Controller (Triggered by HR)
async function notify_all(student_ids, message) {
    // Add all students to a background job queue
    // This takes seconds, not hours.
    await notificationQueue.addBulk(student_ids.map(id => ({
        name: 'send_notification',
        data: { student_id: id, message: message }
    })));

    return { status: "Queued", total: student_ids.length };
}

// 2. The Worker Processor (Runs in the background)
worker.process('send_notification', async (job) => {
    const { student_id, message } = job.data;

    try {
        // Step A: Save to DB (Persistent record)
        await save_to_db(student_id, message);

        // Step B: Send Email (External API)
        // If this fails, the queue will automatically retry this specific job
        await send_email(student_id, message);

        // Step C: Push to App (Real-time SSE)
        await push_to_app(student_id, message);

    } catch (error) {
        log_error(`Failed for ${student_id}: ${error.message}`);
        throw error; // Re-throwing tells the queue to retry later
    }
});
```

---

# Stage 6: Priority Inbox Implementation

### 1. The Concept: Priority Inbox
The Priority Inbox is designed to ensure that students see the most critical and relevant information first. Instead of a simple chronological list, we use a weighted algorithm to bubble up important updates like "Placement" drives and "Results" over general "Events".

### 2. The Weightage System
We assign a numerical weight to each notification type to define its relative importance:
| Notification Type | Weight | Priority Level |
| :--- | :--- | :--- |
| **Placement** | 3 | High |
| **Result** | 2 | Medium |
| **Event** | 1 | Low |

### 3. Sorting Algorithm
The top `n` notifications are determined by a **Multi-Level Sort**:
1.  **Primary Sort (Weight)**: Notifications are first grouped by their importance (e.g., all Placements appear above all Results).
2.  **Secondary Sort (Recency)**: Within the same weight group, notifications are sorted by their `timestamp` in descending order (newest first).

**Formula for Ranking:**
`Score = (TypeWeight * 10^10) + UnixTimestamp`
*By using a large multiplier for the weight, we ensure that an older "Placement" notification still appears above a brand new "Event" notification.*

### 4. Implementation Details
The implementation will:
*   Fetch the raw data from the protected `evaluation-service/notifications` API.
*   Apply the sorting logic using JavaScript's `.sort()` method.
*   Slice the top 10 results for the display.
*   Maintain performance by only sorting the unread set.

### 5. Maintenance of Top 10
As new notifications arrive via SSE or polling, the system will:
1.  Insert the new notification into the current list.
2.  Re-run the sorting algorithm.
3.  Keep only the top 10 and discard/relegate the rest to a "General" inbox.

---

# Stage 7: Frontend Implementation (React/Next.js)

### 1. Architectural Overview
The frontend is built using React to provide a fast, responsive, and SEO-friendly user interface. We utilize **Material UI (MUI) for professional, clean, and interactive components while maintaining a custom design system through native CSS where required.

### 2. Core Features
* Main Notification Dashboard: Displays all notifications in a scrollable list.
* Priority Inbox View: A dedicated section/page that uses the weighted algorithm from Stage 6 to show the top "n" critical updates.
*  Live Filtering: Users can filter by notification type (Placement, Result, Event, etc.) and read status.
*Interactive Actions: "Mark as Read" buttons that trigger backend updates and real-time UI state changes.


